import MongooseCRUDManager from '../models/MongooseCRUDManager.mjs';
import Order from '../models/order/orderModel.mjs';
import Cart from '../models/cart/cartModel.mjs';

class OrderService extends MongooseCRUDManager {
    constructor() {
        super(Order);
    }

    async createOrder(userId, shippingAddress) {
        const cart = await Cart.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            throw new Error('Cart is empty');
        }

        const order = await this.create({
            userId,
            items: cart.items,
            total: cart.total,
            shippingAddress
        });

        await Cart.deleteOne({ userId });
        return order;
    }
}

export default new OrderService();