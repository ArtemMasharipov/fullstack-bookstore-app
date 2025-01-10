import express from 'express';
import { createOrder, getUserOrders, getOrderDetails } from '../controllers/orderController.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

router.post('/orders', auth, createOrder);
router.get('/orders', auth, getUserOrders);
router.get('/orders/:orderId', auth, getOrderDetails);

export default router;