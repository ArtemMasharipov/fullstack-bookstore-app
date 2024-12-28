import UsersDBService from '../models/user/UsersDBService.mjs';
import RolesDBService from '../models/role/RolesDBService.mjs';
import { validationResult } from 'express-validator';

export const getAllUsers = async (req, res) => {
  try {
    const users = await UsersDBService.getList({}, null, ['role']);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await UsersDBService.getById(req.params.id, ['role']);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password, roleName } = req.body;
    const newUser = await UsersDBService.createUser({
      username,
      email,
      password,
      roleName,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updatedUser = await UsersDBService.update(req.params.id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await UsersDBService.deleteById(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserCart = async (req, res) => {
  try {
    const cart = await UsersDBService.getUserCart(req.user.id);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const updatedCart = await UsersDBService.addToCart(
      req.user.id,
      bookId,
      quantity,
    );
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.body;
    const updatedCart = await UsersDBService.removeFromCart(
      req.user.id,
      bookId,
    );
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const syncCart = async (req, res) => {
  try {
    const { cart } = req.body;
    const updatedCart = await UsersDBService.syncCart(req.user.id, cart);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
