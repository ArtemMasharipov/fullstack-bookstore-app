import Cart from './cartModel.mjs';
import Book from '../book/bookModel.mjs';
import mongoose from 'mongoose';

class CartDBService {
    async getUserCart(userId) {
        let cart = await Cart.findOne({ userId }).populate('items.bookId');
        if (!cart) {
            cart = await Cart.create({ userId, items: [], totalPrice: 0 });
        }
        return cart;
    }

    async addToCart(userId, bookId, quantity) {
        const book = await Book.findById(bookId);
        if (!book) {
            throw new Error('Book not found');
        }

        let cart = await this.getUserCart(userId);
        const existingItem = cart.items.find(item => 
            item.bookId.toString() === bookId.toString()
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                bookId: book._id,
                quantity,
                price: book.price
            });
        }

        // Пересчитываем общую стоимость
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();
        return cart.populate('items.bookId');
    }

    async removeCartItem(userId, itemId) {
        const cart = await this.getUserCart(userId);
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();
        return cart.populate('items.bookId');
    }

    async updateCartItem(userId, itemId, quantity) {
        const cart = await this.getUserCart(userId);
        const item = cart.items.find(item => item._id.toString() === itemId);
        
        if (!item) {
            throw new Error('Item not found in cart');
        }

        item.quantity = quantity;
        cart.totalPrice = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        await cart.save();
        return cart.populate('items.bookId');
    }
}

export default new CartDBService();
