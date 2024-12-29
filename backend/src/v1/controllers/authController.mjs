import UsersDBService from '../models/user/UsersDBService.mjs';
import RolesDBService from '../models/role/RolesDBService.mjs';
import { prepareToken } from '../../../services/jwtHelpers.mjs';
import { validationResult } from 'express-validator';
import { ROLES } from '../../../services/permissions-handler/roleConfig.mjs';

class AuthController {
  static async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required' });
    }

    try {
      const user = await UsersDBService.findByEmail(email);
      if (!user || !(await user.isValidPassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = prepareToken({ id: user._id, roleId: user.role._id });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          ...user.toObject(),
          permissions: user.role.permissions,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
      const userExists = await UsersDBService.findByEmail(email);
      if (userExists) {
        return res.status(409).json({ error: 'User already exists' });
      }

      const assignedRole = await RolesDBService.model.findOne({
        name: ROLES.USER,
      });
      if (!assignedRole) {
        console.error('Role "user" not found. Returning empty permissions.');
        return res.status(400).json({ error: 'Invalid role provided.' });
      }

      const newUser = await UsersDBService.createUser({
        username,
        email,
        password,
        roleName: assignedRole.name,
      });

      const token = prepareToken({ id: newUser._id, roleId: newUser.role });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          ...newUser.toObject(),
          permissions: assignedRole.permissions,
        },
        token,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
