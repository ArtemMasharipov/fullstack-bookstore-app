/**
 * Cart Service Layer
 *
 * Pattern: write operations use raw ObjectIds (getOrCreate / findOne — no populate),
 * then populate books right before returning to the controller.
 */

import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

/** Populate book refs and return the cart */
async function withBooks(cart) {
  await cart.populate(Cart.POPULATE_BOOKS);
  return cart;
}

/**
 * Get user's cart (creates empty if none exists)
 */
export async function getCart(userId) {
  const cart = await Cart.getOrCreate(userId);
  return withBooks(cart);
}

/**
 * Add item to cart
 */
export async function addToCart(userId, { bookId, quantity = 1 }) {
  if (!bookId) throw new ValidationError("Book ID is required");
  if (quantity < 1 || quantity > 99) {
    throw new ValidationError("Quantity must be between 1 and 99");
  }

  const book = await Book.findById(bookId);
  if (!book) throw new NotFoundError("Book not found");
  if (!book.inStock) throw new ValidationError("Book is out of stock");

  // Unpopulated cart — item.book is raw ObjectId, .toString() works
  const cart = await Cart.getOrCreate(userId);

  const existing = cart.items.find(
    (item) => item.book.toString() === bookId
  );

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > 99) {
      throw new ValidationError("Cannot add more than 99 of the same book");
    }
    existing.quantity = newQty;
    existing.price = book.price;
  } else {
    cart.items.push({ book: bookId, quantity, price: book.price });
  }

  await cart.save();
  return withBooks(cart);
}

/**
 * Update item quantity
 */
export async function updateCartItem(userId, bookId, quantity) {
  if (quantity < 1 || quantity > 99) {
    throw new ValidationError("Quantity must be between 1 and 99");
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError("Cart not found");

  const item = cart.items.find((i) => i.book.toString() === bookId);
  if (!item) throw new NotFoundError("Item not found in cart");

  item.quantity = quantity;

  await cart.save();
  return withBooks(cart);
}

/**
 * Remove item from cart
 */
export async function removeFromCart(userId, bookId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError("Cart not found");

  const before = cart.items.length;
  cart.items = cart.items.filter((i) => i.book.toString() !== bookId);
  if (cart.items.length === before) {
    throw new NotFoundError("Item not found in cart");
  }

  await cart.save();
  return withBooks(cart);
}

/**
 * Clear entire cart
 */
export async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new NotFoundError("Cart not found");

  cart.items = [];
  await cart.save();
  return cart;
}

/**
 * Sync cart — update prices, remove out-of-stock items
 */
export async function syncCart(userId) {
  const cart = await Cart.getOrCreate(userId);
  const updates = { pricesUpdated: [], removedOutOfStock: [] };

  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    const book = await Book.findById(item.book);

    if (!book || !book.inStock) {
      updates.removedOutOfStock.push({
        bookId: item.book,
        title: book?.title || "Unknown",
      });
      cart.items.splice(i, 1);
    } else if (book.price !== item.price) {
      updates.pricesUpdated.push({
        bookId: item.book,
        title: book.title,
        oldPrice: item.price,
        newPrice: book.price,
      });
      item.price = book.price;
    }
  }

  await cart.save();
  return { cart: await withBooks(cart), updates };
}

/**
 * Validate cart before checkout
 */
export async function validateCart(userId) {
  const cart = await Cart.findByUser(userId);
  if (!cart || cart.items.length === 0) {
    throw new ValidationError("Cart is empty");
  }

  const issues = [];

  for (const item of cart.items) {
    const bookId = item.book._id || item.book;
    const book = await Book.findById(bookId);

    if (!book) {
      issues.push({ bookId, issue: "Book no longer exists" });
    } else if (!book.inStock) {
      issues.push({ bookId: book._id, title: book.title, issue: "Out of stock" });
    } else if (book.price !== item.price) {
      issues.push({
        bookId: book._id,
        title: book.title,
        issue: "Price changed",
        oldPrice: item.price,
        newPrice: book.price,
      });
    }
  }

  return { valid: issues.length === 0, issues, cart };
}
