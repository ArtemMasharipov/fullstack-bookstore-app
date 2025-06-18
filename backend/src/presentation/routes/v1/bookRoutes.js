import { Router } from 'express'
import upload from '../../../infrastructure/external-services/upload-handler.js'
import {
  ACTION_TYPES,
  RESOURCE_TYPES,
  generatePermission,
} from '../../../shared/constants/permissions.js'
import bookValidationSchema from '../../../shared/validation/bookValidationSchema.js'
import * as booksController from '../../controllers/v1/bookController.js'
import { checkAuth, checkPermission } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.get('/', booksController.getAllBooks)
router.get('/:id', booksController.getBookById)

router.post(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.BOOK)),
  upload,
  bookValidationSchema,
  validateRequest,
  booksController.createBook
)

router.put(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.BOOK)),
  upload,
  bookValidationSchema,
  validateRequest,
  booksController.updateBook
)

router.delete(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.BOOK)),
  booksController.deleteBook
)

export default router
