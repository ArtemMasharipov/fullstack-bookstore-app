import { Router } from 'express';
import * as booksController from '../controllers/bookController.mjs';
import bookValidationSchema from '../../../validation/bookValidationSchema.mjs';
import {
  checkAuth,
  checkPermission,
} from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import {
  ACTION_TYPES,
  RESOURCE_TYPES,
  generatePermission,
} from '../../../services/permissions-handler/permissionsConst.mjs';
import upload from '../../../services/upload-handler.mjs';

const router = Router();

router.get('/', booksController.getAllBooks);
router.get('/:id', booksController.getBookById);

router.post(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.BOOK)),
  upload,
  bookValidationSchema,
  validateRequest,
  booksController.createBook,
);

router.put(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.BOOK)),
  upload,
  bookValidationSchema,
  validateRequest,
  booksController.updateBook,
);

router.delete(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.BOOK)),
  booksController.deleteBook,
);

export default router;
