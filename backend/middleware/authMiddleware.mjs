import { verifyToken, extractToken } from '../services/jwtHelpers.mjs';
import User from '../src/v1/models/user/userModel.mjs';

export const checkAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    const decoded = verifyToken(token);

    const userWithPermissions = await User.findById(decoded.id).populate(
      'role',
    );
    if (!userWithPermissions) {
      throw new Error('Invalid token');
    }

    req.user = userWithPermissions;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const checkPermission = (requiredPermission) => (req, res, next) => {
  const permissions =
    req.user?.role?.permissions.map((p) => p.toLowerCase()) || [];
  if (!permissions.includes(requiredPermission.toLowerCase())) {
    return res.status(403).json({ message: 'Permission denied' });
  }
  next();
};
