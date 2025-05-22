import CartDBService from '../models/cart/CartDBService.mjs';

const sendResponse = (res, data, status = 200) => 
    res.status(status).json({ success: true, ...data });

const handleError = (res, error) => 
    res.status(error.status || 500).json({ 
        success: false, 
        error: error.message 
    });

export const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        if (!bookId || quantity < 1) {
            throw { status: 400, message: 'Invalid input' };
        }
        const cart = await CartDBService.addToCart(req.user.id, bookId, quantity);
        sendResponse(res, { cart });
    } catch (error) {
        handleError(res, error);
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await CartDBService.getUserCart(req.user.id);
        sendResponse(res, {
            items: cart?.items || [],
            totalPrice: cart?.totalPrice || 0
        });
    } catch (error) {
        handleError(res, error);
    }
};

export const updateCartItem = async (req, res) => {
    try {
        const cart = await CartDBService.updateCartItem(
            req.user.id,
            req.params.itemId,
            req.body.quantity,
        );
        sendResponse(res, { cart });
    } catch (error) {
        handleError(res, error);
    }
};

export const removeCartItem = async (req, res) => {
    try {
        const cart = await CartDBService.removeCartItem(
            req.user.id,
            req.params.id
        );
        sendResponse(res, {
            items: cart.items,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        handleError(res, error);
    }
};

export const syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) {
            throw { status: 400, message: 'Cart must be an array' };
        }

        const syncedCart = await CartDBService.syncCart(req.user.id, cart);
        sendResponse(res, {
            items: syncedCart.items,
            totalPrice: syncedCart.totalPrice
        });
    } catch (error) {
        handleError(res, error);
    }
};

export const clearCart = async (req, res) => {
    try {
        await CartDBService.clearCart(req.user.id);
        sendResponse(res, { items: [], totalPrice: 0 });
    } catch (error) {
        handleError(res, error);
    }
};
