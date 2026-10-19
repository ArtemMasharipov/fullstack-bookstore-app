/**
 * Order Routes
 * Defines order management endpoints
 */

import express from "express";
import * as orderController from "../controllers/orderController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authorize, protect } from "../middleware/auth.js";
import { requireIdempotencyKey } from "../middleware/idempotencyKey.js";
import { validate } from "../middleware/validate.js";
import {
  adminListOrdersQuery,
  createOrderBody,
  emptyOrderQuery,
  listOrdersQuery,
  orderIdParams,
  orderStatusBody,
  orderPaymentBody,
} from "../schemas/order.js";

const router = express.Router();

// =============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =============================================================================

// Apply protect middleware to all routes
router.use(protect);

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    All orders, newest first, each with its customer
 * @query   page = 1, limit = 20 (at most 100), status?, paymentStatus?
 * @access  Private/Admin
 */
router.get(
  "/admin/all",
  authorize("admin"),
  validate({ query: adminListOrdersQuery }),
  asyncHandler(orderController.listAllOrders)
);

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Order counts and the revenue of paid orders in geller
 * @access  Private/Admin
 */
router.get(
  "/admin/stats",
  authorize("admin"),
  validate({ query: emptyOrderQuery }),
  asyncHandler(orderController.orderStats)
);

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Set the status of an order
 * @body    { status }
 * @access  Private/Admin
 */
router.patch(
  "/:id/status",
  authorize("admin"),
  validate({ params: orderIdParams, query: emptyOrderQuery, body: orderStatusBody }),
  asyncHandler(orderController.setOrderStatus)
);

/**
 * @route   PATCH /api/v1/orders/:id/payment
 * @desc    Record a payment or a manually completed refund
 * @access  Private/Admin
 */
router.patch(
  "/:id/payment",
  authorize("admin"),
  validate({ params: orderIdParams, query: emptyOrderQuery, body: orderPaymentBody }),
  asyncHandler(orderController.setOrderPayment)
);

// =============================================================================
// USER ROUTES
// =============================================================================

/**
 * @route   POST /api/v1/orders
 * @desc    Place an order from the cart, once per Idempotency-Key
 * @header  Idempotency-Key: <uuid>
 * @body    { shippingAddress, expectedTotal }
 * @access  Private
 */
router.post(
  "/",
  requireIdempotencyKey,
  validate({ body: createOrderBody }),
  asyncHandler(orderController.createOrder)
);

/**
 * @route   GET /api/v1/orders
 * @desc    The user's orders, newest first
 * @query   page = 1, limit = 10 (at most 50)
 * @access  Private
 */
router.get(
  "/",
  validate({ query: listOrdersQuery }),
  asyncHandler(orderController.listOrders)
);

/**
 * @route   GET /api/v1/orders/:id
 * @desc    One order, with customer and allowed actions for admins
 * @params  :id (required)
 * @access  Private
 */
router.get(
  "/:id",
  validate({ params: orderIdParams, query: emptyOrderQuery }),
  asyncHandler(orderController.getOrder)
);

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel a pending order that is not paid
 * @params  :id (required)
 * @access  Private
 */
router.patch(
  "/:id/cancel",
  validate({ params: orderIdParams }),
  asyncHandler(orderController.cancelOrder)
);

export default router;
