/**
 * Order Service Layer
 * Contains business logic for order management
 */

import { createHash } from "node:crypto";
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import { ConflictError, NotFoundError, UnprocessableError } from "../utils/errors.js";
import { getCartView } from "./cartService.js";
import { nextOrderNumber } from "./orderNumber.js";
import { toOrderSummary, toOrderView } from "./orderView.js";
import { planOrderTransition } from "./orderTransitions.js";

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
 * A page of the user's orders, newest first
 * @returns {{ items: Object[], pagination: { page, limit, total, pages } }}
 */
export async function listOrders(userId, { page, limit }) {
  const filter = { user: userId };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: orders.map(toOrderSummary),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

// Another user's order answers like a missing one, so its existence stays hidden
const orderNotFound = () => new NotFoundError("Order not found");

export async function getOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw orderNotFound();
  return toOrderView(order);
}

/**
 * Cancels a pending order that is not paid. One conditional update, so a
 * payment or a status change arriving at the same moment cannot be overwritten.
 */
export async function cancelOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw orderNotFound();
  return writeTransition(order, { axis: "status", to: "cancelled", by: "user" });
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

// Older orders have no paymentStatus: theirs is read from isPaid
const PAYMENT_FILTERS = {
  paid: { $or: [{ paymentStatus: "paid" }, { paymentStatus: { $exists: false }, isPaid: true }] },
  unpaid: {
    $or: [{ paymentStatus: "unpaid" }, { paymentStatus: { $exists: false }, isPaid: { $ne: true } }],
  },
  failed: { paymentStatus: "failed" },
};

const customerOf = (user) =>
  user ? { id: user._id.toString(), email: user.email, username: user.username } : null;

/**
 * A page of all orders, newest first, with their customer (null when the
 * account no longer exists)
 */
export async function listAllOrders({ page, limit, status, paymentStatus }) {
  const filter = {
    ...(status && { status }),
    ...(paymentStatus && PAYMENT_FILTERS[paymentStatus]),
  };
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "username email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    items: orders.map((order) => ({ ...toOrderView(order), customer: customerOf(order.user) })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

const changedMeanwhile = () =>
  new ConflictError("The order changed meanwhile, reload it", "CONFLICT");

async function findOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order) throw orderNotFound();
  return order;
}

// Missing paymentStatus is a legacy snapshot, distinct from a newly written
// status with the same meaning: compare both stored axes before changing either.
async function writeTransition(order, action) {
  const { set, history } = planOrderTransition(order, { ...action, at: new Date() });
  const payment = Object.hasOwn(order, "paymentStatus")
    ? { paymentStatus: order.paymentStatus }
    : { paymentStatus: { $exists: false }, isPaid: Object.hasOwn(order, "isPaid") ? order.isPaid : { $exists: false } };
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status, ...payment },
    { $set: set, $push: { statusHistory: { $each: history } } },
    { new: true, runValidators: true, strict: false }
  ).lean();
  if (!updated) throw changedMeanwhile();
  return toOrderView(updated);
}

export async function setOrderStatus(orderId, status) {
  return writeTransition(await findOrder(orderId), { axis: "status", to: status, by: "admin" });
}

/** Manual accounting only; this function never calls a payment provider. */
export async function setOrderPayment(orderId, paymentStatus) {
  return writeTransition(await findOrder(orderId), { axis: "payment", to: paymentStatus, by: "admin" });
}

// An older order's total is a float in crowns; it counts in geller
const totalInGeller = {
  $cond: [
    { $eq: ["$schemaVersion", 2] },
    "$quote.total",
    { $round: [{ $multiply: ["$totalPrice", 100] }, 0] },
  ],
};

/**
 * Order counts and the revenue of paid orders, in geller
 */
export async function orderStats() {
  const [total, byStatus, paidOrders, revenue] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.countDocuments(PAYMENT_FILTERS.paid),
    Order.aggregate([
      { $match: PAYMENT_FILTERS.paid },
      { $group: { _id: null, total: { $sum: totalInGeller } } },
    ]),
  ]);

  const counts = Object.fromEntries(byStatus.map(({ _id, count }) => [_id, count]));
  return {
    total,
    byStatus: counts,
    paidOrders,
    pendingOrders: counts.pending ?? 0,
    deliveredOrders: counts.delivered ?? 0,
    totalRevenue: revenue[0]?.total ?? 0,
    currency: "CZK",
  };
}
