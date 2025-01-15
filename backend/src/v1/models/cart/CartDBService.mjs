import Cart from './cartModel.mjs';
import Book from '../book/bookModel.mjs';
import mongoose from 'mongoose';

class CartDBService {
    async getUserCart(userId) {
        const cart = await Cart.findOne({ userId }).populate('items.bookId');
        if (!cart) {
            return Cart.create({ userId, items: [], totalPrice: 0 });
        }
        return cart;
    }

    async addToCart(userId, bookId, quantity) {
        try {
            const book = await Book.findById(bookId);
            if (!book) {
                throw new Error('Book not found');
            }

            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = await Cart.create({
                    userId,
                    items: [],
                    totalPrice: 0
                });
            }

            const existingItemIndex = cart.items.findIndex(item => 
                item.bookId?.toString() === bookId.toString()
            );

            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                cart.items.push({
                    bookId: book._id,
                    quantity,
                    price: book.price
                });
            }

            cart.totalPrice = cart.items.reduce((total, item) => 
                total + (item.price * item.quantity), 0
            );

            await cart.save();
            const populatedCart = await cart.populate('items.bookId');
            
            return populatedCart;
        } catch (error) {
            console.error('CartDBService addToCart error:', error);
            throw error;
        }
    }

    async removeCartItem(userId, itemId) {
        const cart = await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
            { new: true }
        ).populate('items.bookId');

        if (!cart) {
            throw new Error('Cart not found');
        }

        await cart.save();
        return cart;
    }

    async updateCartItem(userId, itemId, quantity) {
        const cart = await this.getUserCart(userId);
        const item = cart.items.find(item => item._id.toString() === itemId);
        
        if (!item) {
            throw new Error('Item not found in cart');
        }

        item.quantity = quantity;
        cart.totalPrice = this.calculateTotalPrice(cart.items);
        await cart.save();
        return cart.populate('items.bookId');
    }

    async clearCart(userId) {
        try {
            const cart = await Cart.findOneAndUpdate(
                { userId },
                { 
                    items: [], 
                    totalPrice: 0 
                },
                { 
                    new: true,
                    upsert: true 
                }
            );
            return cart;
        } catch (error) {
            console.error('Clear cart error:', error);
            throw error;
        }
    }

    async syncCart(userId, localCartItems) {
        try {
            let cart = await this.getUserCart(userId);
            
            if (!cart) {
                cart = await Cart.create({
                    userId,
                    items: [],
                    totalPrice: 0
                });
            }

            const validatedItems = await Promise.all(
                localCartItems.map(async (item) => {
                    const book = await Book.findById(item.bookId);
                    if (!book) return null;
                    
                    return {
                        bookId: book._id,
                        quantity: parseInt(item.quantity),
                        price: book.price
                    };
                })
            );

            const filteredItems = validatedItems.filter(item => item !== null);

            cart.items = filteredItems;
            
            cart.totalPrice = filteredItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);

            await cart.save();
            return cart.populate('items.bookId', 'title image price');
        } catch (error) {
            console.error('Cart sync error:', error);
            throw error;
        }
    }
}

export default new CartDBService();
