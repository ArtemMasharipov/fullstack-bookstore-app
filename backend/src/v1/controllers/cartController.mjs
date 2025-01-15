import CartDBService from '../models/cart/CartDBService.mjs';

export const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        if (!bookId || !quantity) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const cart = await CartDBService.addToCart(req.user.id, bookId, quantity);
        const populatedCart = await cart.populate('items.bookId');
        res.status(200).json(populatedCart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCart = async (req, res) => {
    try {
        const cart = await CartDBService.getUserCart(req.user.id);
        res.status(200).json({
            items: cart?.items || [],
            totalPrice: cart?.totalPrice || 0
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message || 'Failed to fetch cart'
        });
    }
};

export const updateCartItem = async (req, res) => {
  try {
    const cart = await CartDBService.updateCartItem(
      req.user.id,
      req.params.itemId,
      req.body.quantity,
    );
    res.status(200).json(cart);
  } catch (error) {
    res
      .status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export const removeCartItem = async (req, res) => {
    try {
        const cart = await CartDBService.removeCartItem(
            req.user.id,
            req.params.id
        );

        res.json({
            success: true,
            items: cart.items,
            totalPrice: cart.totalPrice
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) {
            return res.status(400).json({ error: 'Cart must be an array' });
        }

        const syncedCart = await CartDBService.syncCart(req.user.id, cart);
        res.status(200).json({
            success: true,
            items: syncedCart.items,
            totalPrice: syncedCart.totalPrice
        });
    } catch (error) {
        res.status(500).json({ 
            error: error.message || 'Failed to sync cart'
        });
    }
};

export const clearCart = async (req, res) => {
    try {
        await CartDBService.clearCart(req.user.id);
        res.status(200).json({ items: [], totalPrice: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
