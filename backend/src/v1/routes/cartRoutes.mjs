import { Router } from 'express';
import * as cartController from '../controllers/cartController.mjs';
import cartValidationSchema from '../../../validation/cartValidationSchema.mjs';
import { checkAuth, checkPermission } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import { ACTION_TYPES, RESOURCE_TYPES, generatePermission } from '../../../services/permissions-handler/permissionsConst.mjs';

const router = Router();

router.get(
  '/',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.READ, RESOURCE_TYPES.CART)),
  cartController.getCart
);

router.post(
  '/items',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.CREATE, RESOURCE_TYPES.CART)),
  cartValidationSchema,
  validateRequest,
  cartController.addToCart
);

router.put(
  '/items/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.UPDATE, RESOURCE_TYPES.CART)),
  cartValidationSchema,
  validateRequest,
  cartController.updateCartItem
);

router.delete(
  '/items/:id',
  checkAuth,
  checkPermission(generatePermission(ACTION_TYPES.DELETE, RESOURCE_TYPES.CART)),
  cartController.removeCartItem
);

export default router;
