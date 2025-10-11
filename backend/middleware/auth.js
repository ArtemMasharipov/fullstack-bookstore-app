/**
 * Authentication Middleware
 * Protects routes and authorizes based on user roles
 */

import jwt from 'jsonwebtoken'
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js'

/**
 * Protect routes - verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    // Check if token exists
    if (!token) {
      throw new UnauthorizedError('Access denied. No token provided.')
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Add user to request object
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token')
    }
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired')
    }
    next(error)
  }
}

/**
 * Authorize specific roles
 * Usage: authorize('admin'), authorize('admin', 'moderator')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Access denied. Please log in.')
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access denied. Role ${req.user.role} is not authorized to access this resource.`
      )
    }

    next()
  }
}
