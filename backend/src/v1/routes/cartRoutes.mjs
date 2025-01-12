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
    (req, res, next) => {
        console.log('Cart route: Request user:', req.user);
        next();
    },
    cartController.addToCart
);
router.post('/remove/:id', cartController.removeCartItem);
router.put('/update/:id', cartController.updateCartItem);
router.post('/sync', cartController.syncCart);

export default router;
