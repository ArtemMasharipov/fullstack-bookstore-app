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
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(200).json({
    success: true,
    data: user,
    message: "User updated successfully",
  });
}

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private/Admin
 */
export async function deleteUser(req, res) {
  const result = await userService.deleteUser(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
}

/**
 * @route   DELETE /api/v1/users/:id/permanent
 * @desc    Permanently delete user
 * @access  Private/Admin
 */
export async function permanentlyDeleteUser(req, res) {
  const result = await userService.permanentlyDeleteUser(
    req.params.id,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
}

/**
 * @route   GET /api/v1/users/role/:role
 * @desc    Get users by role
 * @access  Private/Admin
 */
export async function getUsersByRole(req, res) {
  const users = await userService.getUsersByRole(req.params.role);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
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
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      error: "isActive must be a boolean value",
    });
  }

  const user = await userService.toggleUserStatus(req.params.id, isActive);

  res.status(200).json({
    success: true,
    data: user,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
  });
}
