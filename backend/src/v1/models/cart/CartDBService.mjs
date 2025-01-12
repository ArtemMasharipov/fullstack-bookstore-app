import Cart from './cartModel.mjs';
import Book from '../book/bookModel.mjs';

class CartDBService {
    async getUserCart(userId) {
        let cart = await Cart.findOne({ userId }).populate('items.bookId');
        if (!cart) {
            cart = await Cart.create({ userId, items: [], totalPrice: 0 });
        }
        return cart;
    }

    async addToCart(userId, bookId, quantity) {
        try {
            console.log('CartDBService: Adding to cart:', { userId, bookId, quantity });
            
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

            // Ищем существующий товар по bookId
            const existingItemIndex = cart.items.findIndex(item => 
                item.bookId?.toString() === bookId.toString()
            );

            if (existingItemIndex > -1) {
                // Обновляем количество существующего товара
                cart.items[existingItemIndex].quantity += quantity;
                console.log('Updated existing item quantity:', cart.items[existingItemIndex]);
            } else {
                // Добавляем новый товар
                cart.items.push({
                    bookId: book._id,
                    quantity,
                    price: book.price
                });
                console.log('Added new item to cart');
            }

            // Пересчитываем общую стоимость
            cart.totalPrice = cart.items.reduce((total, item) => 
                total + (item.price * item.quantity), 0
            );

            // Сохраняем и возвращаем обновленную корзину с populated items
            await cart.save();
            const populatedCart = await cart.populate('items.bookId');
            console.log('Cart after update:', populatedCart);
            
            return populatedCart;
        } catch (error) {
            console.error('CartDBService addToCart error:', error);
            throw error;
        }
    }

    async removeCartItem(userId, itemId) {
        const cart = await this.getUserCart(userId);
        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.totalPrice = this.calculateTotalPrice(cart.items);
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
        cart.totalPrice = this.calculateTotalPrice(cart.items);
        await cart.save();
        return cart.populate('items.bookId');
    }

    async clearCart(userId) {
        await Cart.findOneAndUpdate(
            { userId },
            { items: [], totalPrice: 0 },
            { new: true }
        );
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

            // Validate and fetch books for local cart items
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

            // Filter out invalid items
            const filteredItems = validatedItems.filter(item => item !== null);

            // Merge with existing cart items
            cart.items = filteredItems;
            
            // Recalculate total price
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

    calculateTotalPrice(items) {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
}

export default new CartDBService();
