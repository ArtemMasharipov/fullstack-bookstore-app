/**
 * Cart Routes
 * Defines shopping cart endpoints
 */

import express from 'express'
import * as cartController from '../controllers/cartController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// =============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// =============================================================================

// Apply protect middleware to all routes
router.use(protect)

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart
 * @access  Private
 */
router.get('/', asyncHandler(cartController.getCart))

/**
 * @route   GET /api/v1/cart/validate
 * @desc    Validate cart before checkout
 * @access  Private
 */
router.get('/validate', asyncHandler(cartController.validateCart))

/**
 * @route   POST /api/v1/cart
 * @desc    Add item to cart
 * @body    { bookId, quantity? }
 * @access  Private
 */
router.post('/', asyncHandler(cartController.addToCart))

/**
 * @route   POST /api/v1/cart/sync
 * @desc    Sync cart with current prices and availability
 * @access  Private
 */
router.post('/sync', asyncHandler(cartController.syncCart))

/**
 * @route   PUT /api/v1/cart/:bookId
 * @desc    Update item quantity in cart
 * @params  :bookId (required)
 * @body    { quantity: number }
 * @access  Private
 */
router.put('/:bookId', asyncHandler(cartController.updateCartItem))

/**
 * @route   DELETE /api/v1/cart/:bookId
 * @desc    Remove item from cart
 * @params  :bookId (required)
 * @access  Private
 */
router.delete('/:bookId', asyncHandler(cartController.removeFromCart))

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear entire cart
 * @access  Private
 */
router.delete('/', asyncHandler(cartController.clearCart))

export default router
