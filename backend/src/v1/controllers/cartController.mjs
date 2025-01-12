import CartDBService from '../models/cart/CartDBService.mjs';

export const addToCart = async (req, res) => {
    try {
        const { bookId, quantity } = req.body;
        if (!bookId || !quantity) {
            return res.status(400).json({ error: 'BookId and quantity are required' });
        }

        const cart = await CartDBService.addToCart(req.user.id, bookId, parseInt(quantity));
        res.status(200).json(cart);
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(error.message.includes('not found') ? 404 : 500)
            .json({ error: error.message });
    }
};

export const getCart = async (req, res) => {
  try {
    const cart = await CartDBService.getUserCart(req.user.id).populate('items.bookId', 'title image');
    res.status(200).json(cart);
  } catch (error) {
    res
      .status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
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
      req.params.itemId,
    );
    res.status(200).json(cart);
  } catch (error) {
    res
      .status(error.message.includes('not found') ? 404 : 500)
      .json({ error: error.message });
  }
};

export const syncCart = async (req, res) => {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) {
            return res.status(400).json({ error: 'Cart must be an array' });
        }

        const syncedCart = await CartDBService.syncCart(req.user.id, cart);
        res.status(200).json(syncedCart);
    } catch (error) {
        console.error('Sync cart error:', error);
        res.status(500).json({ error: error.message });
    }
};
