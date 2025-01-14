import { Router } from 'express';
import * as cartController from '../controllers/cartController.mjs';
import cartValidationSchema from '../../../validation/cartValidationSchema.mjs';
import { checkAuth } from '../../../middleware/authMiddleware.mjs';
import { validateRequest } from '../../../middleware/validationMiddleware.mjs';

const router = Router();

// Add auth check middleware first
router.use(checkAuth);

router.get('/', cartController.getCart);
router.post('/add', 
    cartValidationSchema, 
    validateRequest,
    cartController.addToCart
);
router.put('/update/:id', cartController.updateCartItem);
router.post('/sync', cartController.syncCart);
router.delete('/items/:id', cartController.removeCartItem);

export default router;
