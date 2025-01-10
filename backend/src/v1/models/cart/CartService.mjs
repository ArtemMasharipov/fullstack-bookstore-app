import MongooseCRUDManager from '../models/MongooseCRUDManager.mjs';
import Cart from '../models/cart/cartModel.mjs';

class CartService extends MongooseCRUDManager {
    constructor() {
        super(Cart);
    }

    async addToCart(userId, bookId, quantity) {
        let cart = await this.findOne({ userId });
        if (!cart) {
            cart = await this.create({ userId, items: [] });
        }

        const bookIndex = cart.items.findIndex(item => item.bookId.toString() === bookId);
        if (bookIndex > -1) {
            cart.items[bookIndex].quantity += quantity;
        } else {
            const book = await Book.findById(bookId);
            cart.items.push({
                bookId,
                quantity,
                price: book.price
            });
        }

        cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
        return await cart.save();
    }
}

export default new CartService();