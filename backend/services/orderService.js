/**
 * Order Service Layer
 * Contains business logic for order management
 */

import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnprocessableError,
  ValidationError,
} from "../utils/errors.js";
import { getCartView } from "./cartService.js";
import { nextOrderNumber } from "./orderNumber.js";
import { toOrderView } from "./orderView.js";

// JSON with the keys of every object sorted, so equal bodies hash equally
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

const hashOf = (body) => createHash("sha256").update(canonicalJson(body)).digest("hex");

/**
 * The order an earlier request with this key created, or null. The same key
 * with another body is a conflict: the client reused a key it should not have.
 */
async function findReplay(userId, idempotencyKey, requestHash) {
  const order = await Order.findOne({ user: userId, idempotencyKey }).lean();
  if (!order) return null;
  if (order.requestHash !== requestHash) {
    throw new ConflictError(
      "This Idempotency-Key was used with another request",
      "IDEMPOTENCY_CONFLICT"
    );
  }
  return order;
}

// Why the cart cannot become an order at the total the customer saw, or null
function cartProblem(view, expectedTotal) {
  if (view.items.length === 0) return new UnprocessableError("Cart is empty", "CART_EMPTY");

  const unavailable = view.items.filter((line) => !line.available);
  if (unavailable.length) {
    return new UnprocessableError("Cart has unavailable items", "CART_HAS_UNAVAILABLE_ITEMS", {
      items: unavailable.map((line) => ({ bookId: line.bookId, reason: line.unavailableReason })),
    });
  }

  if (expectedTotal !== view.quote.total) {
    const { freeShippingThreshold, ...quote } = view.quote;
    return new ConflictError("The total has changed", "PRICE_CHANGED", { quote });
  }
  return null;
}

/**
 * Places an order from the user's cart, once per Idempotency-Key.
 *
 * A repeated request (same key, same body) answers the order it created,
 * also when the cart is already empty. The key is checked again before
 * answering a cart problem, because a parallel request with the same key may
 * have just placed the order and emptied the cart.
 *
 * @returns {{ order: Object, created: boolean }}
 */
export async function createOrder(userId, body, idempotencyKey) {
  const requestHash = hashOf(body);
  const replay = (order) => ({ order: toOrderView(order), created: false });

  const earlier = await findReplay(userId, idempotencyKey, requestHash);
  if (earlier) return replay(earlier);

  const view = await getCartView(userId);
  const problem = cartProblem(view, body.expectedTotal);
  if (problem) {
    const placed = await findReplay(userId, idempotencyKey, requestHash);
    if (placed) return replay(placed);
    throw problem;
  }

  const lines = view.items;
  const { freeShippingThreshold, ...quote } = view.quote;
  let order;
  try {
    order = await Order.create({
      orderNumber: await nextOrderNumber(),
      user: userId,
      items: lines.map(({ bookId, title, unitPrice, quantity, lineTotal }) => ({
        book: bookId,
        title,
        unitPrice,
        quantity,
        lineTotal,
      })),
      shippingAddress: body.shippingAddress,
      quote,
      statusHistory: [{ axis: "status", from: null, to: "pending", by: "user", at: new Date() }],
      idempotencyKey,
      requestHash,
    });
  } catch (error) {
    // A parallel request with the same key stored its order first
    if (error.code !== 11000 || !error.keyPattern?.idempotencyKey) throw error;
    return replay(await findReplay(userId, idempotencyKey, requestHash));
  }

  // Only the ordered lines, and only while their quantity is the ordered one:
  // a line changed meanwhile stays in the cart. There is no transaction yet
  // (stage 4): if this fails, the order stands, the cart keeps its lines, and
  // a retry with the same key answers the order.
  await Cart.updateOne(
    { user: userId },
    {
      $pull: {
        items: {
          $or: lines.map(({ bookId, quantity }) => ({
            book: new mongoose.Types.ObjectId(bookId),
            quantity,
          })),
        },
      },
    }
  );

  return { order: toOrderView(order.toObject()), created: true };
}

/**
 * Get user's orders
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options (status, page, limit)
 * @returns {Object} { orders, pagination }
 */
export async function getUserOrders(userId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters;

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new ValidationError("Page and limit must be greater than 0");
  }

  if (limit > 50) {
    throw new ValidationError("Maximum limit is 50");
  }

  const query = { user: userId };
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;

  // Execute queries in parallel
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("items.book", "title author image")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Object} Order
 */
export async function getOrderById(orderId, userId) {
  const order = await Order.findById(orderId)
    .populate("items.book", "title author image category price")
    .populate("user", "username email")
    .lean();

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Check if user owns this order (unless admin check is added later)
  if (order.user._id.toString() !== userId) {
    throw new ForbiddenError("You do not have access to this order");
  }

  return order;
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Object} Updated order
 */
export async function cancelOrder(orderId, userId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Check ownership
  if (order.user.toString() !== userId) {
    throw new ForbiddenError("You do not have access to this order");
  }

  // Check if can be cancelled
  if (order.status === "delivered") {
    throw new ValidationError("Cannot cancel delivered order");
  }

  if (order.status === "cancelled") {
    throw new ValidationError("Order is already cancelled");
  }

  order.cancel();
  await order.save();

  await order.populate("items.book", "title author image");

  return order;
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

/**
 * Get all orders (admin)
 * @param {Object} filters - Filter options (status, isPaid, isDelivered, page, limit)
 * @returns {Object} { orders, pagination }
 */
export async function getAllOrders(filters = {}) {
  const { status, isPaid, isDelivered, page = 1, limit = 20 } = filters;

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new ValidationError("Page and limit must be greater than 0");
  }

  if (limit > 100) {
    throw new ValidationError("Maximum limit is 100");
  }

  // Build query
  const query = {};
  if (status) query.status = status;
  if (isPaid !== undefined) query.isPaid = isPaid === "true";
  if (isDelivered !== undefined) query.isDelivered = isDelivered === "true";

  const skip = (page - 1) * limit;

  // Execute queries in parallel
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("user", "username email")
      .populate("items.book", "title")
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Update order status (admin)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Object} Updated order
 */
export async function updateOrderStatus(orderId, status) {
  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Status must be one of: ${validStatuses.join(", ")}`
    );
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  // Cannot change status of cancelled order
  if (order.status === "cancelled" && status !== "cancelled") {
    throw new ValidationError("Cannot change status of cancelled order");
  }

  order.status = status;

  // Auto-mark as delivered if status is delivered
  if (status === "delivered") {
    order.markAsDelivered();
  }

  await order.save();

  await order.populate("items.book", "title author image");
  await order.populate("user", "username email");

  return order;
}

/**
 * Mark order as paid (admin)
 * @param {string} orderId - Order ID
 * @returns {Object} Updated order
 */
export async function markOrderAsPaid(orderId) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  if (order.isPaid) {
    throw new ValidationError("Order is already marked as paid");
  }

  order.markAsPaid();
  await order.save();

  await order.populate("items.book", "title author image");
  await order.populate("user", "username email");

  return order;
}

/**
 * Get order statistics (admin)
 * @returns {Object} Order statistics
 */
export async function getOrderStats() {
  const [total, byStatus, totalRevenue, paidOrders, deliveredOrders] =
    await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Order.countDocuments({ isPaid: true }),
      Order.countDocuments({ isDelivered: true }),
    ]);

  const statusStats = {};
  byStatus.forEach((item) => {
    statusStats[item._id] = item.count;
  });

  return {
    total,
    byStatus: statusStats,
    totalRevenue: totalRevenue[0]?.total || 0,
    paidOrders,
    deliveredOrders,
    pendingOrders: statusStats.pending || 0,
  };
}
