import UsersDBService from '../models/user/UsersDBService.mjs';
import RolesDBService from '../models/role/RolesDBService.mjs';
import { validationResult } from 'express-validator';
import User from '../models/user/userModel.mjs';

export const getAllUsers = async (req, res) => {
  try {
    const users = await UsersDBService.getList({}, null, ['role']);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await UsersDBService.getById(req.params.id, ['role']);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('role');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ permissions: user.role.permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, role } = req.body;

    const roleExists = await RolesDBService.model.findOne({
      name: role || 'user',
    });
    if (!roleExists) {
      return res.status(400).json({ error: 'Invalid role provided.' });
    }

    const newUser = await UsersDBService.createUser({
      email,
      password,
      role: roleExists.name,
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { role, ...userData } = req.body;

    if (role) {
      const roleExists = await RolesDBService.model.findOne({ name: role });
      if (!roleExists) {
        return res.status(400).json({ error: 'Invalid role provided.' });
      }
      userData.role = roleExists._id;
    }

    const updatedUser = await UsersDBService.update(req.params.id, userData);
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await UsersDBService.deleteById(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
