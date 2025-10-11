/**
 * Cart Service Layer
 * Contains business logic for shopping cart operations
 */

import Cart from '../models/Cart.js';
import Book from '../models/Book.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

/**
 * Get user's cart
 * @param {string} userId - User ID
 * @returns {Object} Cart with items
 */
export async function getCart(userId) {
  const cart = await Cart.findByUser(userId);
  
  if (!cart) {
    // Create empty cart if doesn't exist
    const newCart = await Cart.create({ user: userId, items: [] });
    return newCart;
  }

  return cart;
}

/**
 * Add item to cart
 * @param {string} userId - User ID
 * @param {Object} itemData - { bookId, quantity }
 * @returns {Object} Updated cart
 */
export async function addToCart(userId, itemData) {
  const { bookId, quantity = 1 } = itemData;

  // Validate input
  if (!bookId) {
    throw new ValidationError('Book ID is required');
  }

  if (quantity < 1 || quantity > 99) {
    throw new ValidationError('Quantity must be between 1 and 99');
  }

  // Check if book exists and is in stock
  const book = await Book.findById(bookId);
  
  if (!book) {
    throw new NotFoundError('Book not found');
  }

  if (!book.inStock) {
    throw new ValidationError('Book is out of stock');
  }

  // Get or create cart
  const cart = await Cart.getOrCreate(userId);

  // Check if item already exists in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.book.toString() === bookId
  );

  if (existingItemIndex > -1) {
    // Update quantity of existing item
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (newQuantity > 99) {
      throw new ValidationError('Cannot add more than 99 items of the same book');
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].price = book.price; // Update price in case it changed
  } else {
    // Add new item
    cart.items.push({
      book: bookId,
      quantity,
      price: book.price
    });
  }

  await cart.save();
  
  // Populate and return
  await cart.populate({
    path: 'items.book',
    select: 'title author price image inStock category'
  });

  return cart;
}

/**
 * Update item quantity in cart
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @param {number} quantity - New quantity
 * @returns {Object} Updated cart
 */
export async function updateCartItem(userId, bookId, quantity) {
  // Validate quantity
  if (quantity < 1 || quantity > 99) {
    throw new ValidationError('Quantity must be between 1 and 99');
  }

  const cart = await Cart.findOne({ user: userId });
  
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  // Find item in cart
  const itemIndex = cart.items.findIndex(
    item => item.book.toString() === bookId
  );

  if (itemIndex === -1) {
    throw new NotFoundError('Item not found in cart');
  }

  // Update quantity
  cart.items[itemIndex].quantity = quantity;

  await cart.save();
  
  // Populate and return
  await cart.populate({
    path: 'items.book',
    select: 'title author price image inStock category'
  });

  return cart;
}

/**
 * Remove item from cart
 * @param {string} userId - User ID
 * @param {string} bookId - Book ID
 * @returns {Object} Updated cart
 */
export async function removeFromCart(userId, bookId) {
  const cart = await Cart.findOne({ user: userId });
  
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  // Filter out the item
  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    item => item.book.toString() !== bookId
  );

  if (cart.items.length === initialLength) {
    throw new NotFoundError('Item not found in cart');
  }

  await cart.save();
  
  // Populate and return
  await cart.populate({
    path: 'items.book',
    select: 'title author price image inStock category'
  });

  return cart;
}

/**
 * Clear entire cart
 * @param {string} userId - User ID
 * @returns {Object} Empty cart
 */
export async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  cart.items = [];
  await cart.save();

  return cart;
}

/**
 * Sync cart items with current book prices and availability
 * @param {string} userId - User ID
 * @returns {Object} Updated cart with sync info
 */
export async function syncCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  
  if (!cart) {
    throw new NotFoundError('Cart not found');
  }

  const updates = {
    pricesUpdated: [],
    removedOutOfStock: []
  };

  // Check each item
  for (let i = cart.items.length - 1; i >= 0; i--) {
    const item = cart.items[i];
    const book = await Book.findById(item.book);

    if (!book || !book.inStock) {
      // Remove out of stock items
      updates.removedOutOfStock.push({
        bookId: item.book,
        title: book ? book.title : 'Unknown'
      });
      cart.items.splice(i, 1);
    } else if (book.price !== item.price) {
      // Update price if changed
      updates.pricesUpdated.push({
        bookId: item.book,
        title: book.title,
        oldPrice: item.price,
        newPrice: book.price
      });
      cart.items[i].price = book.price;
    }
  }

  await cart.save();
  
  await cart.populate({
    path: 'items.book',
    select: 'title author price image inStock category'
  });

  return {
    cart,
    updates
  };
}

/**
 * Validate cart before checkout
 * @param {string} userId - User ID
 * @returns {Object} Validation result
 */
export async function validateCart(userId) {
  const cart = await Cart.findByUser(userId);
  
  if (!cart || cart.items.length === 0) {
    throw new ValidationError('Cart is empty');
  }

  const issues = [];

  // Check each item
  for (const item of cart.items) {
    const book = await Book.findById(item.book._id || item.book);

    if (!book) {
      issues.push({
        bookId: item.book._id || item.book,
        issue: 'Book no longer exists'
      });
    } else if (!book.inStock) {
      issues.push({
        bookId: book._id,
        title: book.title,
        issue: 'Out of stock'
      });
    } else if (book.price !== item.price) {
      issues.push({
        bookId: book._id,
        title: book.title,
        issue: 'Price changed',
        oldPrice: item.price,
        newPrice: book.price
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    cart
  };
}
