/**
 * Auth Routes
 * Defines authentication endpoints
 */

import express from 'express'
import * as authController from '../controllers/authController.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @body    { username, email, password, firstName?, lastName? }
 * @access  Public
 */
router.post('/register', asyncHandler(authController.register))

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @body    { emailOrUsername, password }
 * @access  Public
 */
router.post('/login', asyncHandler(authController.login))

// =============================================================================
// PROTECTED ROUTES (Authenticated Users)
// =============================================================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', protect, asyncHandler(authController.getCurrentUser))

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password
 * @body    { currentPassword, newPassword }
 * @access  Private
 */
router.put('/password', protect, asyncHandler(authController.changePassword))

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @body    { firstName?, lastName?, username? }
 * @access  Private
 */
router.put('/profile', protect, asyncHandler(authController.updateProfile))

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, asyncHandler(authController.logout))

export default router
