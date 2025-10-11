/**
 * Book Routes
 * Defines all routes for book-related operations
 */

import express from 'express';
import * as bookController from '../controllers/bookController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/books
 * @desc    Get all books with filtering and pagination
 * @params  ?page=1&limit=20&category=fiction&authorId=xxx&inStock=true&search=query&sortBy=-createdAt
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(bookController.getBooks)
);

/**
 * @route   GET /api/v1/books/category/:category
 * @desc    Get books by category
 * @params  :category (required), ?limit=20&sortBy=-createdAt
 * @access  Public
 */
router.get(
  '/category/:category',
  asyncHandler(bookController.getBooksByCategory)
);

/**
 * @route   GET /api/v1/books/author/:authorId
 * @desc    Get books by author
 * @params  :authorId (required), ?limit=50&sortBy=-publicationYear
 * @access  Public
 */
router.get(
  '/author/:authorId',
  asyncHandler(bookController.getBooksByAuthor)
);

/**
 * @route   GET /api/v1/books/:id
 * @desc    Get single book by ID
 * @params  :id (required)
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(bookController.getBook)
);

// =============================================================================
// PROTECTED ROUTES (Admin Only)
// =============================================================================

/**
 * @route   POST /api/v1/books
 * @desc    Create new book
 * @body    { title, authorId, publicationYear, category, description, price, image?, inStock? }
 * @access  Private/Admin
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(bookController.createBook)
);

/**
 * @route   PUT /api/v1/books/:id
 * @desc    Update book (full update)
 * @params  :id (required)
 * @body    { title?, authorId?, publicationYear?, category?, description?, price?, image?, inStock? }
 * @access  Private/Admin
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(bookController.updateBook)
);

/**
 * @route   PATCH /api/v1/books/:id/stock
 * @desc    Update book stock status only
 * @params  :id (required)
 * @body    { inStock: boolean }
 * @access  Private/Admin
 */
router.patch(
  '/:id/stock',
  protect,
  authorize('admin'),
  asyncHandler(bookController.updateBookStock)
);

/**
 * @route   DELETE /api/v1/books/:id
 * @desc    Delete book
 * @params  :id (required)
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(bookController.deleteBook)
);

export default router;
