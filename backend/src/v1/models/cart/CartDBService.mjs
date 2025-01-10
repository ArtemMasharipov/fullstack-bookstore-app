import MongooseCRUDManager from '../MongooseCRUDManager.mjs';
import Cart from './cartModel.mjs';
import Book from '../book/bookModel.mjs';

class CartDBService extends MongooseCRUDManager {
  constructor() {
    super(Cart);
  }

  async addToCart(userId, bookId, quantity) {
    let cart = await this.findOne({ userId });
    if (!cart) {
      cart = await this.create({ 
        userId, 
        items: [],
        totalPrice: 0 // Соответствует схеме
      });
    }

    const bookIndex = cart.items.findIndex(
      (item) => item.bookId.toString() === bookId,
    );
    if (bookIndex > -1) {
      cart.items[bookIndex].quantity += quantity;
    } else {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }
      cart.items.push({
        bookId,
        quantity,
        price: book.price,
      });
    }

    cart.total = this._calculateTotal(cart.items);
    return await cart.save();
  }

  async updateCartItem(userId, itemId, quantity) {
    const cart = await this.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId,
    );
    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = this._calculateTotal(cart.items);
    return await cart.save();
  }

  async removeCartItem(userId, itemId) {
    const cart = await this.findOne({ userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
    cart.total = this._calculateTotal(cart.items);
    return await cart.save();
  }

  async getUserCart(userId) {
    const cart = await this.findOne({ userId }, null, ['items.bookId']);
    if (!cart) {
      throw new Error('Cart not found');
    }
    return cart;
  }

  _calculateTotal(items) {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  async updateTotalPrice(cart) {
    cart.totalPrice = this._calculateTotal(cart.items);
    return await cart.save();
  }
}

export default new CartDBService();
