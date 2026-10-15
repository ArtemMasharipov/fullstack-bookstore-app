/**
 * Cart Controller Layer
 * Every answer is a cart view: { items, quote }
 */

import * as cartService from "../services/cartService.js";
import { ok } from "../utils/respond.js";

/**
 * @route   GET /api/v1/cart
 * @access  Private
 */
export async function getCart(req, res) {
  ok(res, await cartService.getCartView(req.user.id));
}

/**
 * @route   POST /api/v1/cart
 * @body    { bookId, quantity = 1 }
 * @access  Private
 */
export async function addItem(req, res) {
  ok(res, await cartService.addItem(req.user.id, req.valid.body));
}

/**
 * @route   PUT /api/v1/cart/:bookId
 * @body    { quantity }
 * @access  Private
 */
export async function setItemQuantity(req, res) {
  const { bookId } = req.valid.params;
  const { quantity } = req.valid.body;
  ok(res, await cartService.setItemQuantity(req.user.id, bookId, quantity));
}

/**
 * @route   DELETE /api/v1/cart/:bookId
 * @access  Private
 */
export async function removeItem(req, res) {
  ok(res, await cartService.removeItem(req.user.id, req.valid.params.bookId));
}

/**
 * @route   DELETE /api/v1/cart
 * @access  Private
 */
export async function clearCart(req, res) {
  ok(res, await cartService.clearCart(req.user.id));
}

/**
 * @route   POST /api/v1/cart/quote
 * @body    { items: [{ bookId, quantity }] }
 * @access  Public
 */
export async function quote(req, res) {
  ok(res, await cartService.quoteItems(req.valid.body.items));
}
