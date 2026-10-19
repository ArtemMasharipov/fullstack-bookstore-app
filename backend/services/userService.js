/**
 * User Service Layer
 * Handles user management logic (admin operations)
 */

import User from "../models/User.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";
import { endUserSessions } from "./sessions.js";
import { roleOf, toUserView } from "./userView.js";
import { sortOf } from "../utils/listSort.js";

const takesAdminAccess = (user, changes) =>
  user.role === "admin" &&
  user.isActive &&
  ((changes.role !== undefined && changes.role !== "admin") || changes.isActive === false);

/**
 * Writes a change of a user's role or status. Nobody takes away their own
 * admin access. The acting admin is an active admin, so the shop can lose its
 * last one only when two admins take each other's access at the same moment;
 * the count is therefore checked after the write, and a write that left no
 * active admin is undone. A role change or a deactivation ends the user's
 * sessions, once it stands.
 * @param {Object} user - The user as stored before the change
 * @param {Object} changes - The fields being written ({ role?, isActive?, … })
 * @param {string} actorId - Id of the acting admin
 * @param {Function} prepare - Validates profile conflicts before any write
 */
async function changeAccess(user, changes, actorId, prepare = async () => {}) {
  const takesAccess = takesAdminAccess(user, changes);
  if (takesAccess && user._id.toString() === actorId) {
    throw new ConflictError(
      "You cannot take away your own admin access",
      "ADMIN_SELF_CHANGE"
    );
  }

  await prepare();
  const conflict = () => new ConflictError("The user changed meanwhile, reload it");
  const access = { role: user.role, isActive: user.isActive };
  const profile = Object.fromEntries(Object.entries(changes).filter(([key]) => !["role", "isActive"].includes(key)));
  const previousProfile = Object.fromEntries(Object.keys(profile).map((key) => [key, user[key] ?? null]));
  const write = (filter, updates) => User.findOneAndUpdate(
    { _id: user._id, ...filter }, { $set: updates }, { new: true, runValidators: true }
  ).select("-password");
  let updated;
  if (takesAccess) {
    const accessChanges = Object.fromEntries(Object.entries(changes).filter(([key]) => ["role", "isActive"].includes(key)));
    const staged = await write(access, accessChanges);
    if (!staged) throw conflict();
    const writtenAccess = { role: staged.role, isActive: staged.isActive };
    const undo = () => User.updateOne(
      { _id: user._id, ...writtenAccess },
      { $set: Object.fromEntries(Object.keys(accessChanges).map((key) => [key, user[key]])) }
    );
    if (!(await User.exists({ role: "admin", isActive: true }))) {
      await undo();
      throw new ConflictError("The shop needs at least one active admin", "LAST_ADMIN");
    }
    // The rejected LAST_ADMIN path never writes a profile. A concurrent profile
    // edit is not undone, nor silently replaced by this request's later write.
    try {
      updated = Object.keys(profile).length ? await write({ ...writtenAccess, ...previousProfile }, profile) : staged;
      if (!updated) throw conflict();
    } catch (error) {
      await undo();
      throw error;
    }
  } else {
    updated = Object.keys(changes).length ? await write({ ...access, ...previousProfile }, changes) : user;
    if (!updated) throw conflict();
  }

  const roleChanged = changes.role !== undefined && changes.role !== user.role;
  if (roleChanged || changes.isActive === false) await endUserSessions(user._id);
  return updated;
}

/**
 * Get users with filtering and pagination
 * @param {Object} filters - Query filters (page, limit, role, isActive, search, sortBy)
 * @returns {Object} { users, pagination }
 */
export async function getUsers({ page, limit, role, isActive, search, sortBy }) {
  const query = {};
  if (role) query.role = role === "admin" ? "admin" : { $ne: "admin" };
  if (isActive !== undefined) query.isActive = isActive;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = ["username", "email", "firstName", "lastName"].map((field) => ({ [field]: pattern }));
  }
  const [users, total] = await Promise.all([
    User.find(query).sort(sortOf(sortBy)).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(query),
  ]);

  return {
    users: users.map(toUserView),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
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

  return toUserView(user);
}

/**
 * Create user (admin only)
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
async function refuseDuplicate(data, id) {
  const identities = ["username", "email"].filter((field) => Object.hasOwn(data, field));
  if (!identities.length) return;
  const duplicate = await User.findOne({
    ...(id && { _id: { $ne: id } }),
    $or: identities.map((field) => ({ [field]: data[field] })),
  });
  if (duplicate) {
    const fields = Object.fromEntries(identities.filter((field) => duplicate[field] === data[field]).map((field) => [field, "duplicate"]));
    throw new AppError("A user with this identity already exists", 409, "CONFLICT", { fields });
  }
}

export async function createUser({ username, email, password, role, firstName, lastName }) {
  await refuseDuplicate({ username, email });
  const user = await User.create({ username, email, password, role, firstName, lastName });
  return toUserView(user);
}

/**
 * Update user (admin only)
 * @param {string} id - User ID
 * @param {Object} updateData - Fields to update
 * @param {string} actorId - Id of the acting admin
 * @returns {Object} Updated user
 */
export async function updateUser(id, updateData, actorId) {
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
  ];
  const updates = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates[field] = updateData[field];
    }
  }

  return toUserView(await changeAccess(existingUser, updates, actorId, () => refuseDuplicate(updates, id)));
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

  const roleStats = { user: 0, admin: 0 };
  byRole.forEach((item) => {
    roleStats[roleOf({ role: item._id })] += item.count;
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
 * @param {string} actorId - Id of the acting admin
 * @returns {Object} Updated user
 */
export async function toggleUserStatus(id, isActive, actorId) {
  const user = await User.findById(id);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return toUserView(await changeAccess(user, { isActive }, actorId));
}
