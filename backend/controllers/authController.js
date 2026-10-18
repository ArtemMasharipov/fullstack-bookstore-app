/**
 * Auth Controller Layer
 * Handles HTTP requests/responses for authentication
 */

import * as authService from "../services/authService.js";
import { endSession } from "../services/sessions.js";

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
export async function register(req, res) {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      token: result.token,
    },
    message: "User registered successfully",
  });
}

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
export async function login(req, res) {
  const result = await authService.login(req.body);

  res.status(200).json({
    success: true,
    data: {
      user: result.user,
      token: result.token,
    },
    message: "Login successful",
  });
}

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export async function getCurrentUser(req, res) {
  // req.user is set by protect middleware
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
}

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password
 * @access  Private
 */
export async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
}

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export async function updateProfile(req, res) {
  const user = await authService.updateProfile(req.user.id, req.body);

  res.status(200).json({
    success: true,
    data: user,
    message: "Profile updated successfully",
  });
}

/**
 * @route   POST /api/v1/auth/logout
 * @desc    End the session of this token: the token stops working at once
 * @access  Private
 */
export async function logout(req, res) {
  await endSession(req.sessionId);
  res.status(204).end();
}
