/**
 * Author Routes
 * Defines all routes for author-related operations
 */

import express from 'express';
import * as authorController from '../controllers/authorController.js';
import { protect, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/authors
 * @desc    Get all authors with filtering and pagination
 * @params  ?page=1&limit=20&country=USA&search=query&sortBy=-createdAt
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(authorController.getAuthors)
);

/**
 * @route   GET /api/v1/authors/country/:country
 * @desc    Get authors by country
 * @params  :country (required), ?limit=50&sortBy=lastName
 * @access  Public
 */
router.get(
  '/country/:country',
  asyncHandler(authorController.getAuthorsByCountry)
);

/**
 * @route   GET /api/v1/authors/:id
 * @desc    Get single author by ID
 * @params  :id (required), ?includeBooks=true
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(authorController.getAuthor)
);

/**
 * @route   GET /api/v1/authors/:id/books
 * @desc    Get author's books
 * @params  :id (required), ?limit=50&sortBy=-publicationYear&inStock=true
 * @access  Public
 */
router.get(
  '/:id/books',
  asyncHandler(authorController.getAuthorBooks)
);

/**
 * @route   GET /api/v1/authors/:id/stats
 * @desc    Get author statistics
 * @params  :id (required)
 * @access  Public
 */
router.get(
  '/:id/stats',
  asyncHandler(authorController.getAuthorStats)
);

// =============================================================================
// PROTECTED ROUTES (Admin Only)
// =============================================================================

/**
 * @route   POST /api/v1/authors
 * @desc    Create new author
 * @body    { firstName, lastName, bio?, birthYear?, country?, website? }
 * @access  Private/Admin
 */
router.post(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(authorController.createAuthor)
);

/**
 * @route   PUT /api/v1/authors/:id
 * @desc    Update author
 * @params  :id (required)
 * @body    { firstName?, lastName?, bio?, birthYear?, country?, website? }
 * @access  Private/Admin
 */
router.put(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(authorController.updateAuthor)
);

/**
 * @route   DELETE /api/v1/authors/:id
 * @desc    Delete author
 * @params  :id (required), ?deleteBooks=true
 * @access  Private/Admin
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(authorController.deleteAuthor)
);

export default router;
