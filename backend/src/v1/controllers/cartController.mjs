import cartService from '../models/cart/CartService.mjs';

export const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        const userId = req.user.id;
        const cart = await cartService.addToCart(userId, bookId, quantity);
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await cartService.findOne({ userId }, null, ['items.bookId']);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        const cart = await cartService.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cart.items[itemIndex].quantity = quantity;
        cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.id;

        const cart = await cartService.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item._id.toString() !== itemId);
        cart.total = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};