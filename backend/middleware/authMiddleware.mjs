import jwt from 'jsonwebtoken';
import User from '../src/v1/models/user/userModel.mjs';
import dotenv from 'dotenv';

dotenv.config();

const secretKey = process.env.JWT_SECRET;

export const checkAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const userWithPermissions = await User.findById(decoded.id).populate('role');
    if (!userWithPermissions) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = userWithPermissions;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const { permissions } = req.user.role;
    if (!permissions || !permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};
