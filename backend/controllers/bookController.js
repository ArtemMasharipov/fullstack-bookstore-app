/**
 * Book Controller Layer
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to service layer
 */

import * as bookService from "../services/bookService.js";
import { ok } from "../utils/respond.js";

/**
 * @route   GET /api/v1/books
 * @desc    Get all books with filtering and pagination
 * @access  Public
 */
export async function getBooks(req, res) {
  const { books, pagination } = await bookService.getBooks(req.valid.query);
  ok(res, books, { pagination });
}

/**
 * @route   GET /api/v1/books/:id
 * @desc    Get single book by ID
 * @access  Public
 */
export async function getBook(req, res) {
  ok(res, await bookService.getBookById(req.valid.params.id));
}

/**
 * @route   POST /api/v1/books
 * @desc    Create new book
 * @access  Private/Admin
 */
export async function createBook(req, res) {
  ok(res, await bookService.createBook(req.valid.body), { status: 201 });
}

/**
 * @route   PUT /api/v1/books/:id
 * @desc    Update book
 * @access  Private/Admin
 */
export async function updateBook(req, res) {
  ok(res, await bookService.updateBook(req.valid.params.id, req.valid.body));
}

/**
 * @route   DELETE /api/v1/books/:id
 * @desc    Delete book
 * @access  Private/Admin
 */
export async function deleteBook(req, res) {
  await bookService.deleteBook(req.valid.params.id);
  res.status(204).end();
}

/**
 * @route   GET /api/v1/books/category/:category
 * @desc    Get books by category
 * @access  Public
 */
export async function getBooksByCategory(req, res) {
  ok(res, await bookService.getBooksByCategory(req.valid.params.category, req.valid.query));
}

/**
 * @route   PATCH /api/v1/books/:id/stock
 * @desc    Update book stock status
 * @access  Private/Admin
 */
export async function updateBookStock(req, res) {
  ok(res, await bookService.updateBookStock(req.valid.params.id, req.valid.body.inStock));
}

/**
 * @route   GET /api/v1/books/author/:authorId
 * @desc    Get books by author
 * @access  Public
 */
export async function getBooksByAuthor(req, res) {
  ok(res, await bookService.getBooksByAuthor(req.valid.params.authorId, req.valid.query));
}
