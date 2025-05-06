import { Router } from 'express';
import * as authorsController from '../controllers/authorController.mjs';
import authorValidationSchema from '../../../validation/authorValidationSchema.mjs';
import { checkAuth, checkPermission } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import { ACTION_TYPES, RESOURCE_TYPES, generatePermission } from '../../../services/permissions-handler/permissionsConst.mjs';

const router = Router();

router.get('/', authorsController.getAllAuthors);
router.get('/:id/books', authorsController.getAuthorWithBooks);
router.get('/:id', authorsController.getAuthorWithBooks);

router.post(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.AUTHOR)),
  authorValidationSchema,
  validateRequest,
  authorsController.createAuthor,
);

router.put(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.AUTHOR)),
  authorValidationSchema,
  validateRequest,
  authorsController.updateAuthor,
);

router.delete(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.AUTHOR)),
  authorsController.deleteAuthor,
);

export default router;
