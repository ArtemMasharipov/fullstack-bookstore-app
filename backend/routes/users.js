/**
 * User Routes
 * Defines user management endpoints (admin only)
 */

import express from "express";
import * as userController from "../controllers/userController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authorize, protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { emptyUserQuery, updateUserBody, userIdParams, userStatusBody } from "../schemas/user.js";

const router = express.Router();

// =============================================================================
// ALL ROUTES REQUIRE ADMIN AUTHENTICATION
// =============================================================================

// Apply protect and admin authorization to all routes
router.use(protect);
router.use(authorize("admin"));

/**
 * @route   GET /api/v1/users
 * @desc    Get all users with filtering
 * @query   page?, limit?, role?, isActive?, search?
 * @access  Private/Admin
 */
router.get("/", asyncHandler(userController.getUsers));

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private/Admin
 */
router.get("/stats", asyncHandler(userController.getUserStats));

/**
 * @route   GET /api/v1/users/role/:role
 * @desc    Get users by role
 * @params  :role (required)
 * @access  Private/Admin
 */
router.get("/role/:role", asyncHandler(userController.getUsersByRole));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @params  :id (required)
 * @access  Private/Admin
 */
router.get("/:id", asyncHandler(userController.getUser));

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @body    { username, email, password, role? }
 * @access  Private/Admin
 */
router.post("/", asyncHandler(userController.createUser));

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @params  :id (required)
 * @body    { username?, email?, firstName?, lastName?, role? }
 * @access  Private/Admin
 */
router.put("/:id", validate({ params: userIdParams, query: emptyUserQuery, body: updateUserBody }), asyncHandler(userController.updateUser));

/**
 * @route   PATCH /api/v1/users/:id/status
 * @desc    Toggle user active status
 * @params  :id (required)
 * @body    { isActive: boolean }
 * @access  Private/Admin
 */
router.patch("/:id/status", validate({ params: userIdParams, query: emptyUserQuery, body: userStatusBody }), asyncHandler(userController.toggleUserStatus));

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @params  :id (required)
 * @access  Private/Admin
 */
router.delete("/:id", asyncHandler(userController.deleteUser));

/**
 * @route   DELETE /api/v1/users/:id/permanent
 * @desc    Permanently delete user
 * @params  :id (required)
 * @access  Private/Admin
 */
router.delete(
  "/:id/permanent",
  asyncHandler(userController.permanentlyDeleteUser)
);

export default router;
