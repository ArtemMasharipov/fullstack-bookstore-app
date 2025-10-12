/**
 * Auth Service Layer
 * Handles authentication logic: register, login, token generation
 */

import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import User from '../models/User.js'
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors.js'

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @returns {string} JWT token
 */
function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  })
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} { user, token }
 */
export async function register(userData) {
  const { username, email, password, firstName, lastName } = userData

  // Validate required fields
  if (!username || !email || !password) {
    throw new ValidationError('Username, email and password are required')
  }

  // Validate password strength
  if (password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters')
  }

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  })

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError('Email already registered')
    }
    if (existingUser.username === username) {
      throw new ConflictError('Username already taken')
    }
  }

  // Create user
  const user = new User({
    username,
    email,
    password, // Will be hashed by pre-save hook
    firstName,
    lastName,
    role: 'user', // Default role
  })

  await user.save()

  // Generate token
  const token = generateToken({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  })

  // Remove password from response
  const userObject = user.toJSON()
  delete userObject.password

  return {
    user: userObject,
    token,
  }
}

/**
 * Login user
 * @param {Object} credentials - Login credentials (email/username, password)
 * @returns {Object} { user, token }
 */
export async function login(credentials) {
  const { emailOrUsername, password } = credentials

  // Validate input
  if (!emailOrUsername || !password) {
    throw new ValidationError('Email/username and password are required')
  }

  // Find user by email or username
  const user = await User.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername },
    ],
    isActive: true,
  }).select('+password') // Include password field

  if (!user) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Update last login
  await user.updateLastLogin()

  // Generate token
  const token = generateToken({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  })

  // Remove password from response
  const userObject = user.toJSON()
  delete userObject.password

  return {
    user: userObject,
    token,
  }
}

/**
 * Get current user from token
 * @param {string} userId - User ID from token
 * @returns {Object} User data
 */
export async function getCurrentUser(userId) {
  const user = await User.findById(userId).select('-password')

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is disabled')
  }

  return user
}

/**
 * Change password
 * @param {string} userId - User ID
 * @param {Object} passwords - Old and new passwords
 * @returns {Object} Success message
 */
export async function changePassword(userId, passwords) {
  const { currentPassword, newPassword } = passwords

  // Validate input
  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current and new password are required')
  }

  if (newPassword.length < 6) {
    throw new ValidationError('New password must be at least 6 characters')
  }

  if (currentPassword === newPassword) {
    throw new ValidationError(
      'New password must be different from current password'
    )
  }

  // Find user with password
  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword)

  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect')
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword
  await user.save()

  return {
    message: 'Password changed successfully',
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updates - Profile updates
 * @returns {Object} Updated user
 */
export async function updateProfile(userId, updates) {
  // Prevent updating sensitive fields
  const allowedUpdates = ['firstName', 'lastName', 'username']
  const updateData = {}

  for (const key of allowedUpdates) {
    if (updates[key] !== undefined) {
      updateData[key] = updates[key]
    }
  }

  // Check if username is being changed and is unique
  if (updateData.username) {
    const existingUser = await User.findOne({
      username: updateData.username,
      _id: { $ne: userId },
    })

    if (existingUser) {
      throw new ConflictError('Username already taken')
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password')

  if (!user) {
    throw new UnauthorizedError('User not found')
  }

  return user
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired')
    }
    throw new UnauthorizedError('Invalid token')
  }
}
