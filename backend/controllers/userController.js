/**
 * User Controller Layer
 * Handles HTTP requests/responses for user management (admin)
 */

import * as userService from "../services/userService.js";

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filtering
 * @access  Private/Admin
 */
export async function getUsers(req, res) {
  const result = await userService.getUsers(req.query);

  res.status(200).json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
}

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
export async function getUser(req, res) {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: user,
  });
}

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private/Admin
 */
export async function createUser(req, res) {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    success: true,
    data: user,
    message: "User created successfully",
  });
}

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private/Admin
 */
export async function updateUser(req, res) {
  const user = await userService.updateUser(req.valid.params.id, req.valid.body, req.user.id);

  res.status(200).json({
    success: true,
    data: user,
    message: "User updated successfully",
  });
}

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
export async function getUserStats(req, res) {
  const stats = await userService.getUserStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user active status
 * @access  Private/Admin
 */
export async function toggleUserStatus(req, res) {
  const { isActive } = req.valid.body;
  const user = await userService.toggleUserStatus(req.valid.params.id, isActive, req.user.id);

  res.status(200).json({
    success: true,
    data: user,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
  });
}
