import { Router } from 'express';
import { checkAuth } from '../../../middleware/authMiddleware.mjs';
import { getCart, addToCart, removeFromCart, syncCart } from '../controllers/cartController.mjs';

const router = Router();

router.get('/', checkAuth, getCart);
router.post('/add', checkAuth, addToCart);
router.post('/remove', checkAuth, removeFromCart);
router.post('/sync', checkAuth, syncCart);

export default router;