import { Router } from 'express';
import userValidationSchema from '../../../validation/userValidationSchema.mjs';
import * as userController from '../controllers/userController.mjs';
import { checkAuth, checkPermission } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import { ACTION_TYPES, RESOURCE_TYPES, generatePermission } from '../../../services/permissions-handler/permissionsConst.mjs';

const router = Router();

router.get(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.USER)),
  userController.getAllUsers,
);

router.get(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.USER)),
  userController.getUserById,
);

router.get(
  '/permissions',
  checkAuth,
  userController.getUserPermissions,
);

router.put(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.USER)),
  userValidationSchema,
  validateRequest,
  userController.updateUser,
);

router.delete(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.USER)),
  userController.deleteUser,
);

export default router;
