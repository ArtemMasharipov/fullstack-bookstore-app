import express from 'express';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
} from '../controllers/cartController.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

router.post('/cart/add', auth, addToCart);
router.get('/cart', auth, getCart);
router.put('/cart/update/:itemId', auth, updateCartItem);
router.delete('/cart/remove/:itemId', auth, removeCartItem);

export default router;
