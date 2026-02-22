/**
 * User Service Layer
 * Handles user management logic (admin operations)
 */

import User from "../models/User.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../utils/errors.js";

/**
 * Get users with filtering and pagination
 * @param {Object} filters - Query filters (page, limit, role, isActive, search, sortBy)
 * @returns {Object} { users, pagination }
 */
export async function getUsers(filters = {}) {
  const {
    page = 1,
    limit = 20,
    role,
    isActive,
    search,
    sortBy = "-createdAt",
  } = filters;

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new ValidationError("Page and limit must be greater than 0");
  }

  if (limit > 100) {
    throw new ValidationError("Maximum limit is 100");
  }

  // Build query
  const query = {};

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  if (search) {
    query.$or = [
      { username: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;

  // Execute queries in parallel
  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Object} User document
 */
export async function getUserById(id) {
  const user = await User.findById(id).select("-password").lean();

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}

/**
 * Create user (admin only)
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
export async function createUser(userData) {
  const { username, email, password, role, firstName, lastName } = userData;

  // Validate required fields
  if (!username || !email || !password) {
    throw new ValidationError("Username, email and password are required");
  }

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ValidationError("Email already exists");
    }
    if (existingUser.username === username) {
      throw new ValidationError("Username already exists");
    }
  }

  // Validate role
  const validRoles = ["user", "admin", "moderator"];
  if (role && !validRoles.includes(role)) {
    throw new ValidationError(`Role must be one of: ${validRoles.join(", ")}`);
  }

  // Create user
  const user = new User({
    username,
    email,
    password,
    role: role || "user",
    firstName,
    lastName,
  });

  await user.save();

  // Return without password
  const userObject = user.toJSON();
  delete userObject.password;

  return userObject;
}

/**
 * Update user (admin only)
 * @param {string} id - User ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated user
 */
export async function updateUser(id, updateData) {
  // Check user exists
  const existingUser = await User.findById(id);
  if (!existingUser) {
    throw new NotFoundError("User not found");
  }

  // Allowed fields to update
  const allowedFields = [
    "username",
    "email",
    "firstName",
    "lastName",
    "role",
    "isActive",
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  }

  // Check for duplicate username/email if updating
  if (updates.username || updates.email) {
    const duplicateQuery = { _id: { $ne: id } };

    if (updates.username) {
      duplicateQuery.username = updates.username;
    }

    if (updates.email) {
      duplicateQuery.email = updates.email;
    }

    const duplicate = await User.findOne(duplicateQuery);

    if (duplicate) {
      if (duplicate.username === updates.username) {
        throw new ValidationError("Username already exists");
      }
      if (duplicate.email === updates.email) {
        throw new ValidationError("Email already exists");
      }
    }
  }

  // Validate role if updating
  if (updates.role) {
    const validRoles = ["user", "admin", "moderator"];
    if (!validRoles.includes(updates.role)) {
      throw new ValidationError(
        `Role must be one of: ${validRoles.join(", ")}`
      );
    }
  }

  // Prevent modifying certain fields
  delete updates.password;
  delete updates.createdAt;
  delete updates._id;

  // Update user
  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  return user;
}

/**
 * Delete user (admin only)
 * @param {string} id - User ID
 * @param {string} currentUserId - ID of user performing deletion
 * @returns {Object} Success message
 */
export async function deleteUser(id, currentUserId) {
  // Prevent self-deletion
  if (id === currentUserId) {
    throw new ForbiddenError("You cannot delete your own account");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Soft delete by deactivating
  await User.findByIdAndUpdate(id, { isActive: false });

  return {
    message: "User deactivated successfully",
  };
}

/**
 * Permanently delete user (admin only)
 * @param {string} id - User ID
 * @param {string} currentUserId - ID of user performing deletion
 * @returns {Object} Success message
 */
export async function permanentlyDeleteUser(id, currentUserId) {
  // Prevent self-deletion
  if (id === currentUserId) {
    throw new ForbiddenError("You cannot delete your own account");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await User.findByIdAndDelete(id);

  return {
    message: "User permanently deleted",
  };
}

/**
 * Get users by role
 * @param {string} role - User role
 * @returns {Array} Users with specified role
 */
export async function getUsersByRole(role) {
  const validRoles = ["user", "admin", "moderator"];

  if (!validRoles.includes(role)) {
    throw new ValidationError(`Role must be one of: ${validRoles.join(", ")}`);
  }

  const users = await User.findByRole(role).lean();

  return users;
}

/**
 * Get user statistics
 * @returns {Object} User statistics
 */
export async function getUserStats() {
  const [total, active, inactive, byRole] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isActive: false }),
    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const roleStats = {};
  byRole.forEach((item) => {
    roleStats[item._id] = item.count;
  });

  return {
    total,
    active,
    inactive,
    byRole: roleStats,
  };
}

/**
 * Activate/Deactivate user
 * @param {string} id - User ID
 * @param {boolean} isActive - Active status
 * @returns {Object} Updated user
 */
export async function toggleUserStatus(id, isActive) {
  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}
