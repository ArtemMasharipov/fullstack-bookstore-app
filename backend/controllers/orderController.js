/**
 * Order Controller Layer
 * Handles HTTP requests/responses for orders
 */

import * as orderService from "../services/orderService.js";
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
 * @desc    Admins may read any order; other users may read only their own
 * @access  Private
 */
export async function getOrder(req, res) {
  ok(res, await orderService.getOrder(req.user.id, req.valid.params.id, req.user.role));
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
 * @query   page = 1, limit = 20 (at most 100), status?, paymentStatus?
 * @desc    All orders, newest first, each with its customer
 * @access  Private/Admin
 */
export async function listAllOrders(req, res) {
  const { items, pagination } = await orderService.listAllOrders(req.valid.query);
  ok(res, items, { pagination });
}

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @body    { status }
 * @desc    Set the status of an order
 * @access  Private/Admin
 */
export async function setOrderStatus(req, res) {
  ok(res, await orderService.setOrderStatus(req.valid.params.id, req.valid.body.status, req.valid.body.expectedState));
}

/**
 * @route   PATCH /api/v1/orders/:id/payment
 * @desc    Record a payment or a manually completed refund
 * @access  Private/Admin
 */
export async function setOrderPayment(req, res) {
  ok(res, await orderService.setOrderPayment(req.valid.params.id, req.valid.body.paymentStatus, req.valid.body.expectedState));
}

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Order counts and the revenue of paid orders in geller
 * @access  Private/Admin
 */
export async function orderStats(req, res) {
  ok(res, await orderService.orderStats());
}
