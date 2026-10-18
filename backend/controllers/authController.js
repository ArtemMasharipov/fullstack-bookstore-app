/**
 * Auth Controller Layer
 * Handles HTTP requests/responses for authentication
 */

import * as authService from "../services/authService.js";
import { endSession } from "../services/sessions.js";
import { ok } from "../utils/respond.js";

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user: { user, token }
 * @access  Public
 */
export async function register(req, res) {
  ok(res, await authService.register(req.valid.body), { status: 201 });
}

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user: { user, token }
 * @access  Public
 */
export async function login(req, res) {
  ok(res, await authService.login(req.valid.body));
}

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
export async function getCurrentUser(req, res) {
  ok(res, await authService.getCurrentUser(req.user.id));
}

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password: { user, token }; every other token of the user ends
 * @access  Private
 */
export async function changePassword(req, res) {
  ok(res, await authService.changePassword(req.user.id, req.valid.body));
}

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
export async function updateProfile(req, res) {
  ok(res, await authService.updateProfile(req.user.id, req.valid.body));
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
