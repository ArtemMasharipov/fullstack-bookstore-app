import Cart from './cartModel.mjs';
import Book from '../book/bookModel.mjs';
import mongoose from 'mongoose';

class CartDBService {
    async getUserCart(userId) {
        return Cart.findOneAndUpdate(
            { userId },
            { $setOnInsert: { items: [], totalPrice: 0 } },
            { 
                new: true, 
                upsert: true,
                populate: 'items.bookId'
            }
        );
    }

    calculateTotalPrice(items) {
        return items.reduce((total, { price, quantity }) => 
            total + (price * quantity), 0
        );
    }

    async addToCart(userId, bookId, quantity) {
        const [book, cart] = await Promise.all([
            Book.findById(bookId),
            this.getUserCart(userId)
        ]);

        if (!book) throw new Error('Book not found');

        const existingItem = cart.items.find(item => 
            item.bookId?.toString() === bookId.toString()
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

        cart.totalPrice = this.calculateTotalPrice(cart.items);
        await cart.save();
        return cart.populate('items.bookId');
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
