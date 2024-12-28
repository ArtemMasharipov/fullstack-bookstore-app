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
    const userWithPermissions = await User.aggregate([
      { $match: { _id: decoded.id } },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      { $unwind: '$role' },
      {
        $project: {
          _id: 1,
          username: 1,
          email: 1,
          role: 1,
          permissions: '$role.permissions',
        },
      },
    ]);

    if (!userWithPermissions.length) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = userWithPermissions[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    const { permissions } = req.user;
    if (!permissions || !permissions.includes(requiredPermission)) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};
