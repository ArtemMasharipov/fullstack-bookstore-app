import express from 'express';
import * as bookController from '../controllers/bookController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authorize, protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get(
  '/',
  asyncHandler(bookController.getBooks)
);

router.get(
  '/:id',
  asyncHandler(bookController.getBook)
);

router.get(
  '/category/:category',
  asyncHandler(bookController.getBooksByCategory)
);

// Protected routes (admin only)
router.post(
  '/',
  protect,
  authorize('admin'),
  asyncHandler(bookController.createBook)
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(bookController.updateBook)
);

router.delete(
  '/:id',
  protect,
  authorize('admin'),
  asyncHandler(bookController.deleteBook)
);

router.patch(
  '/:id/stock',
  protect,
  authorize('admin'),
  asyncHandler(bookController.updateBookStock)
);

export default router;
