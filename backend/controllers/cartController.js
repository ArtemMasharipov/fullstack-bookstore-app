/**
 * Cart Controller Layer
 * Handles HTTP requests/responses for shopping cart
 */

import * as cartService from '../services/cartService.js';

/**
 * @route   GET /api/v1/cart
 * @desc    Get user's cart
 * @access  Private
 */
export async function getCart(req, res) {
  const cart = await cartService.getCart(req.user.id);

  res.status(200).json({
    success: true,
    data: cart
  });
}

/**
 * @route   POST /api/v1/cart
 * @desc    Add item to cart
 * @access  Private
 */
export async function addToCart(req, res) {
  const cart = await cartService.addToCart(req.user.id, req.body);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item added to cart'
  });
}

/**
 * @route   PUT /api/v1/cart/:bookId
 * @desc    Update item quantity in cart
 * @access  Private
 */
export async function updateCartItem(req, res) {
  const { quantity } = req.body;

  if (!quantity || typeof quantity !== 'number') {
    return res.status(400).json({
      success: false,
      error: 'Quantity must be a number'
    });
  }

  const cart = await cartService.updateCartItem(
    req.user.id,
    req.params.bookId,
    quantity
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart updated'
  });
}

/**
 * @route   DELETE /api/v1/cart/:bookId
 * @desc    Remove item from cart
 * @access  Private
 */
export async function removeFromCart(req, res) {
  const cart = await cartService.removeFromCart(
    req.user.id,
    req.params.bookId
  );

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Item removed from cart'
  });
}

/**
 * @route   DELETE /api/v1/cart
 * @desc    Clear entire cart
 * @access  Private
 */
export async function clearCart(req, res) {
  const cart = await cartService.clearCart(req.user.id);

  res.status(200).json({
    success: true,
    data: cart,
    message: 'Cart cleared'
  });
}

/**
 * @route   POST /api/v1/cart/sync
 * @desc    Sync cart with current prices and availability
 * @access  Private
 */
export async function syncCart(req, res) {
  const result = await cartService.syncCart(req.user.id);

  res.status(200).json({
    success: true,
    data: result.cart,
    updates: result.updates,
    message: 'Cart synced successfully'
  });
}

/**
 * @route   GET /api/v1/cart/validate
 * @desc    Validate cart before checkout
 * @access  Private
 */
export async function validateCart(req, res) {
  const result = await cartService.validateCart(req.user.id);

  res.status(200).json({
    success: result.valid,
    data: result.cart,
    issues: result.issues,
    message: result.valid ? 'Cart is valid' : 'Cart has issues'
  });
}
