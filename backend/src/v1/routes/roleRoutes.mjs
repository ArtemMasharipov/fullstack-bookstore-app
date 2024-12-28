import { Router } from 'express';
import * as rolesController from '../controllers/roleController.mjs';
import roleValidationSchema from '../../../validation/roleValidationSchema.mjs';
import { checkAuth, checkPermission } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import { ACTION_TYPES, RESOURCE_TYPES, generatePermission } from '../../../services/permissions-handler/permissionsConst.mjs';

const router = Router();

router.get(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.ROLE)),
  rolesController.getAllRoles,
);

router.post(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.ROLE)),
  roleValidationSchema,
  validateRequest,
  rolesController.createRole,
);

router.delete(
  '/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.ROLE)),
  rolesController.deleteRole,
);

export default router;
