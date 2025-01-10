import orderService from '../services/orderService.mjs';

export const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shippingAddress } = req.body;
        const order = await orderService.createOrder(userId, shippingAddress);
        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await orderService.getList({ userId }, null, ['items.bookId']);
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await orderService.getById(orderId, ['items.bookId']);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};