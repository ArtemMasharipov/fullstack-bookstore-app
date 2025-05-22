import OrderDBService from '../models/order/OrderDBService.mjs';

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress } = req.body;
    const order = await OrderDBService.createOrder(userId, shippingAddress);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await OrderDBService.getList({ userId }, null, [
      'items.bookId',
    ]);
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await OrderDBService.getById(orderId, ['items.bookId']);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const updatedOrder = await OrderDBService.updateOrderStatus(id, status);
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
