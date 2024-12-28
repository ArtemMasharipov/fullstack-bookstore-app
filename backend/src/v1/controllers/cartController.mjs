import UsersDBService from '../models/user/UsersDBService.mjs';

export const getCart = async (req, res) => {
  try {
    const user = await UsersDBService.getById(req.user.id, ['cart.book']);
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const user = await UsersDBService.getById(req.user.id);

    const existingItem = user.cart.find(item => item.book.toString() === bookId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ book: bookId, quantity });
    }

    await user.save();
    res.status(200).json(user.cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.body;
    const user = await UsersDBService.getById(req.user.id);

    user.cart = user.cart.filter(item => item.book.toString() !== bookId);
    await user.save();
    res.status(200).json(user.cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
};

export const syncCart = async (req, res) => {
  try {
    const { cart } = req.body;
    const user = await UsersDBService.getById(req.user.id);

    cart.forEach(item => {
      const existingItem = user.cart.find(cartItem => cartItem.book.toString() === item.book);
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        user.cart.push(item);
      }
    });

    await user.save();
    res.status(200).json(user.cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync cart' });
  }
};