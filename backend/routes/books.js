/**
 * Book Routes
 * Defines all routes for book-related operations
 */

import express from "express";
import * as bookController from "../controllers/bookController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  authorBooksQuery,
  authorIdParams,
  bookIdParams,
  categoryBooksQuery,
  categoryParams,
  listBooksQuery,
} from "../schemas/book.js";

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/books
 * @desc    Get books with filtering and pagination, newest first
 * @params  ?page=1&limit=20 (at most 100)&category=Fiction (exact)&authorId=<id>&inStock=true|false
 *          &search=text&sortBy=-createdAt (see BOOK_SORTS); any other parameter answers 400
 * @access  Public
 */
router.get("/", validate({ query: listBooksQuery }), asyncHandler(bookController.getBooks));

/**
 * @route   GET /api/v1/books/category/:category
 * @desc    Get books in stock of exactly this category
 * @params  :category (required), ?limit=20&sortBy=-createdAt
 * @access  Public
 */
router.get(
  "/category/:category",
  validate({ params: categoryParams, query: categoryBooksQuery }),
  asyncHandler(bookController.getBooksByCategory)
);

/**
 * @route   GET /api/v1/books/author/:authorId
 * @desc    Get books by author
 * @params  :authorId (required), ?limit=50&sortBy=-publicationYear
 * @access  Public
 */
router.get(
  "/author/:authorId",
  validate({ params: authorIdParams, query: authorBooksQuery }),
  asyncHandler(bookController.getBooksByAuthor)
);

/**
 * @route   GET /api/v1/books/:id
 * @desc    Get single book by ID
 * @params  :id (required)
 * @access  Public
 */
router.get("/:id", validate({ params: bookIdParams }), asyncHandler(bookController.getBook));

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
  "/",
  protect,
  authorize("admin"),
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
  "/:id",
  protect,
  authorize("admin"),
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
  "/:id/stock",
  protect,
  authorize("admin"),
  asyncHandler(bookController.updateBookStock)
);

/**
 * @route   DELETE /api/v1/books/:id
 * @desc    Delete book
 * @params  :id (required)
 * @access  Private/Admin
 */
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(bookController.deleteBook)
);

export default router;
