import cartService from '../models/cart/CartService.mjs';

export const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        const cart = await cartService.addToCart(req.user.id, bookId, quantity);
        res.status(200).json(cart);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500)
            .json({ error: error.message });
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await cartService.getUserCart(req.user.id);
        res.status(200).json(cart);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500)
            .json({ error: error.message });
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const cart = await cartService.updateCartItem(req.user.id, req.params.itemId, req.body.quantity);
        res.status(200).json(cart);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500)
            .json({ error: error.message });
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const cart = await cartService.removeCartItem(req.user.id, req.params.itemId);
        res.status(200).json(cart);
    } catch (error) {
        res.status(error.message.includes('not found') ? 404 : 500)
            .json({ error: error.message });
    }
};