/**
 * Auth Routes
 * Defines authentication endpoints
 */

import express from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { loginBody, passwordBody, profileBody, registerBody } from "../schemas/auth.js";

const router = express.Router();

// Every auth endpoint: failed requests per client are limited
router.use(authRateLimit);

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user; answers 201 { user, token }
 * @body    { username, email, password, firstName?, lastName? }; any other field answers 400
 * @access  Public
 */
router.post("/register", validate({ body: registerBody }), asyncHandler(authController.register));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user; answers { user, token }
 * @body    { emailOrUsername, password }
 * @access  Public
 */
router.post("/login", validate({ body: loginBody }), asyncHandler(authController.login));

// =============================================================================
// PROTECTED ROUTES (Authenticated Users)
// =============================================================================

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get("/me", protect, asyncHandler(authController.getCurrentUser));

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password; answers { user, token } and ends every other session of the user
 * @body    { currentPassword, newPassword }
 * @access  Private
 */
router.put(
  "/password",
  protect,
  validate({ body: passwordBody }),
  asyncHandler(authController.changePassword)
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @body    { firstName?, lastName?, username? }
 * @access  Private
 */
router.put(
  "/profile",
  protect,
  validate({ body: profileBody }),
  asyncHandler(authController.updateProfile)
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    End the session of this token; answers 204
 * @access  Private
 */
router.post("/logout", protect, asyncHandler(authController.logout));

export default router;
