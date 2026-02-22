/**
 * Author Controller Layer
 * Handles HTTP requests/responses ONLY
 * All business logic delegated to service layer
 */

import * as authorService from "../services/authorService.js";

/**
 * @route   GET /api/v1/authors
 * @desc    Get all authors with filtering and pagination
 * @access  Public
 */
export async function getAuthors(req, res) {
  const result = await authorService.getAuthors(req.query);

  res.status(200).json({
    success: true,
    data: result.authors,
    pagination: result.pagination,
  });
}

/**
 * @route   GET /api/v1/authors/:id
 * @desc    Get single author by ID
 * @access  Public
 */
export async function getAuthor(req, res) {
  const includeBooks = req.query.includeBooks === "true";
  const author = await authorService.getAuthorById(req.params.id, includeBooks);

  res.status(200).json({
    success: true,
    data: author,
  });
}

/**
 * @route   POST /api/v1/authors
 * @desc    Create new author
 * @access  Private/Admin
 */
export async function createAuthor(req, res) {
  const author = await authorService.createAuthor(req.body);

  res.status(201).json({
    success: true,
    data: author,
    message: "Author created successfully",
  });
}

/**
 * @route   PUT /api/v1/authors/:id
 * @desc    Update author
 * @access  Private/Admin
 */
export async function updateAuthor(req, res) {
  const author = await authorService.updateAuthor(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: author,
    message: "Author updated successfully",
  });
}

/**
 * @route   DELETE /api/v1/authors/:id
 * @desc    Delete author
 * @access  Private/Admin
 */
export async function deleteAuthor(req, res) {
  const deleteBooks = req.query.deleteBooks === "true";
  const result = await authorService.deleteAuthor(req.params.id, deleteBooks);

  res.status(200).json({
    success: true,
    message: result.message,
    booksDeleted: result.booksDeleted,
  });
}

/**
 * @route   GET /api/v1/authors/country/:country
 * @desc    Get authors by country
 * @access  Public
 */
export async function getAuthorsByCountry(req, res) {
  const authors = await authorService.getAuthorsByCountry(
    req.params.country,
    req.query
  );

  res.status(200).json({
    success: true,
    count: authors.length,
    data: authors,
  });
}

/**
 * @route   GET /api/v1/authors/:id/books
 * @desc    Get author's books
 * @access  Public
 */
export async function getAuthorBooks(req, res) {
  const books = await authorService.getAuthorBooks(req.params.id, req.query);

  res.status(200).json({
    success: true,
    count: books.length,
    data: books,
  });
}

/**
 * @route   GET /api/v1/authors/:id/stats
 * @desc    Get author statistics
 * @access  Public
 */
export async function getAuthorStats(req, res) {
  const stats = await authorService.getAuthorStats(req.params.id);

  res.status(200).json({
    success: true,
    data: stats,
  });
}
