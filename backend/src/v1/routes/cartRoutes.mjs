import { Router } from 'express';
import { checkAuth } from '../../../middleware/authMiddleware.mjs';
import { getUserCart, addToCart, removeFromCart, syncCart } from '../controllers/userController.mjs';

const router = Router();

router.get('/', checkAuth, getUserCart);
router.post('/add', checkAuth, addToCart);
router.post('/remove', checkAuth, removeFromCart);
router.post('/sync', checkAuth, syncCart);

export default router;