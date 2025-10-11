/**
 * Order Routes
 * Defines order management endpoints
 */

import express from 'express'
import * as orderController from '../controllers/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { authorize, protect } from '../middleware/auth.js'

const router = express.Router()

// =============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =============================================================================

// Apply protect middleware to all routes
router.use(protect)

// =============================================================================
// ADMIN ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/orders/admin/all
 * @desc    Get all orders
 * @access  Private/Admin
 */
router.get(
  '/admin/all',
  authorize('admin'),
  asyncHandler(orderController.getAllOrders)
)

/**
 * @route   GET /api/v1/orders/admin/stats
 * @desc    Get order statistics
 * @access  Private/Admin
 */
router.get(
  '/admin/stats',
  authorize('admin'),
  asyncHandler(orderController.getOrderStats)
)

/**
 * @route   PATCH /api/v1/orders/:id/status
 * @desc    Update order status
 * @body    { status: string }
 * @access  Private/Admin
 */
router.patch(
  '/:id/status',
  authorize('admin'),
  asyncHandler(orderController.updateOrderStatus)
)

/**
 * @route   PATCH /api/v1/orders/:id/pay
 * @desc    Mark order as paid
 * @access  Private/Admin
 */
router.patch(
  '/:id/pay',
  authorize('admin'),
  asyncHandler(orderController.markOrderAsPaid)
)

// =============================================================================
// USER ROUTES
// =============================================================================

/**
 * @route   POST /api/v1/orders
 * @desc    Create order from cart
 * @body    { shippingAddress, paymentMethod? }
 * @access  Private
 */
router.post('/', asyncHandler(orderController.createOrder))

/**
 * @route   GET /api/v1/orders
 * @desc    Get user's orders
 * @query   page?, limit?, status?
 * @access  Private
 */
router.get('/', asyncHandler(orderController.getUserOrders))

/**
 * @route   GET /api/v1/orders/:id
 * @desc    Get order by ID
 * @params  :id (required)
 * @access  Private
 */
router.get('/:id', asyncHandler(orderController.getOrder))

/**
 * @route   PATCH /api/v1/orders/:id/cancel
 * @desc    Cancel order
 * @params  :id (required)
 * @access  Private
 */
router.patch('/:id/cancel', asyncHandler(orderController.cancelOrder))

export default router
