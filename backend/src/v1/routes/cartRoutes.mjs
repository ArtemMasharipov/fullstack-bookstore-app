import { Router } from 'express';
import * as cartController from '../controllers/cartController.mjs';
import cartValidationSchema from '../../../validation/cartValidationSchema.mjs';
import { checkAuth } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';

const router = Router();

router.get('/', checkAuth, cartController.getCart);
router.post('/add', checkAuth, cartValidationSchema, validateRequest, cartController.addToCart);
router.post('/remove/:id', checkAuth, cartController.removeCartItem);
router.put('/update/:id', checkAuth, cartController.updateCartItem);
router.post('/sync', checkAuth, cartController.syncCart);

export default router;
