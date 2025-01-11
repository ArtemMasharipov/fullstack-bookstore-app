import { Router } from 'express';
import * as cartController from '../controllers/cartController.mjs';
import cartValidationSchema from '../../../validation/cartValidationSchema.mjs';
import { checkAuth, checkPermission } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';
import { ACTION_TYPES, RESOURCE_TYPES, generatePermission } from '../../../services/permissions-handler/permissionsConst.mjs';

const router = Router();

router.get('/', checkAuth, cartController.getCart);
router.post('/add', checkAuth, cartController.addToCart);
router.post('/remove/:id', checkAuth, cartController.removeCartItem);
router.put('/update/:id', checkAuth, cartController.updateCartItem);

export default router;
