/**
 * Order Controller Layer
 * Handles HTTP requests/responses for orders
 */

import * as orderService from "../services/orderService.js";
import { ValidationError } from "../utils/errors.js";
import { ok } from "../utils/respond.js";

/**
 * @route   POST /api/v1/orders
 * @header  Idempotency-Key: <uuid>
 * @body    { shippingAddress, expectedTotal }
 * @desc    Place an order from the cart: 201 when created, 200 with the same
 *          order when the request repeats an earlier one
 * @access  Private
 */
export async function createOrder(req, res) {
  const { order, created } = await orderService.createOrder(
    req.user.id,
    req.valid.body,
    req.idempotencyKey
  );
  ok(res, order, { status: created ? 201 : 200 });
}

/**
 * @route   GET /api/v1/orders
 * @query   page = 1, limit = 10 (at most 50)
 * @desc    The user's orders, newest first
 * @access  Private
 */
export async function listOrders(req, res) {
  const { items, pagination } = await orderService.listOrders(req.user.id, req.valid.query);
  ok(res, items, { pagination });
}

/**
 * @route   GET /api/v1/orders/:id
 * @desc    One of the user's orders; another user's order is NOT_FOUND
 * @access  Private
 */
export async function getOrder(req, res) {
  ok(res, await orderService.getOrder(req.user.id, req.valid.params.id));
}

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel a pending order that is not paid
 * @access  Private
 */
export async function cancelOrder(req, res) {
  ok(res, await orderService.cancelOrder(req.user.id, req.valid.params.id));
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all orders
 * @access  Private/Admin
 */
export async function getAllOrders(req, res) {
  const result = await orderService.getAllOrders(req.query);

  res.status(200).json({
    success: true,
    data: result.orders,
    pagination: result.pagination,
  });
}

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @access  Private/Admin
 */
export async function updateOrderStatus(req, res) {
  const { status } = req.body;

  if (!status) {
    throw new ValidationError("Status is required", { status: "required" });
  }

  const order = await orderService.updateOrderStatus(req.params.id, status);

  res.status(200).json({
    success: true,
    data: order,
    message: "Order status updated successfully",
  });
}

/**
 * @route   PATCH /api/v1/orders/:id/pay
 * @desc    Mark order as paid
 * @access  Private/Admin
 */
export async function markOrderAsPaid(req, res) {
  const order = await orderService.markOrderAsPaid(req.params.id);

  res.status(200).json({
    success: true,
    data: order,
    message: "Order marked as paid",
  });
}

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Get order statistics
 * @access  Private/Admin
 */
export async function getOrderStats(req, res) {
  const stats = await orderService.getOrderStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}
