import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import Order from './orderModel.mjs';
import Cart from '../cart/cartModel.mjs';

class OrderDBService extends MongooseCRUDManager {
    constructor() {
        super(Order);
    }

    async createOrder(userId, shippingAddress) {
        const cart = await Cart.findOne({ userId }).populate('items.bookId');
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        const order = await this.create({
            userId,
            items: cart.items,
            totalPrice: cart.totalPrice,
            shippingAddress,
            status: 'pending'
        });

        await Cart.deleteOne({ userId });
        return order;
    }

    async findByUserId(userId) {
        return this.model.find({ userId }).populate('items.bookId');
    }

    async updateOrderStatus(orderId, status) {
        return this.update(orderId, { status });
    }
}

export default new OrderDBService();
