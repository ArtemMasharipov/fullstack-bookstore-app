import { Router } from 'express'
import {
  ACTION_TYPES,
  RESOURCE_TYPES,
  generatePermission,
} from '../../../shared/constants/permissions.js'
import authorValidationSchema from '../../../shared/validation/authorValidationSchema.js'
import * as authorsController from '../../controllers/v1/authorController.js'
import { checkAuth, checkPermission } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.get('/', authorsController.getAllAuthors)
router.get('/:id/books', authorsController.getAuthorWithBooks)
router.get('/:id', authorsController.getAuthorWithBooks)

router.post(
  '/',
  checkAuth,
  checkPermission(
    generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.AUTHOR)
  ),
  authorValidationSchema,
  validateRequest,
  authorsController.createAuthor
)

router.put(
  '/:id',
  checkAuth,
  checkPermission(
    generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.AUTHOR)
  ),
  authorValidationSchema,
  validateRequest,
  authorsController.updateAuthor
)

router.delete(
  '/:id',
  checkAuth,
  checkPermission(
    generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.AUTHOR)
  ),
  authorsController.deleteAuthor
)

export default router
