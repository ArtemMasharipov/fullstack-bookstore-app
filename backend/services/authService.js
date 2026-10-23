/**
 * Auth Service Layer
 * Handles authentication logic: register, login, password and profile; the
 * tokens come from sessions.js. Bodies arrive parsed by schemas/auth.js.
 */

import User from "../models/User.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../utils/errors.js";
import { verifyLoginPassword } from "../utils/passwords.js";
import { endUserSessions, issueToken } from "./sessions.js";
import { toUserView } from "./userView.js";

/**
 * Register new user
 * @param {Object} body - Parsed registerBody
 * @returns {Object} { user, token }
 */
export async function register({ username, email, password, firstName, lastName }) {
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError("Email already registered");
    }
    throw new ConflictError("Username already taken");
  }

  // The password is hashed by the pre-save hook
  const user = await User.create({ username, email, password, firstName, lastName, role: "user" });

  return { user: toUserView(user), token: await issueToken(user._id) };
}

/**
 * Login user
 * @param {Object} body - Parsed loginBody
 * @returns {Object} { user, token }
 */
export async function login({ emailOrUsername, password }) {
  const user = await User.findOne({
    $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
  }).select("+password");

  // The password is checked in every case, against a dummy hash when there is
  // no account, so the time of the answer does not tell which case it was
  const passwordMatches = await verifyLoginPassword(password, user?.password);

  if (!user || !passwordMatches || !user.isActive) {
    throw new UnauthorizedError("Invalid credentials");
  }

  // Not save(): it would check the whole stored document, and a role the app
  // no longer has would fail it
  const lastLogin = new Date();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin } });

  return { user: toUserView({ ...user.toObject(), lastLogin }), token: await issueToken(user._id) };
}

/**
 * The signed-in user
 * @param {string} userId - User id of the session
 * @returns {Object} User view
 */
export async function getCurrentUser(userId) {
  const user = await User.findById(userId).lean();

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Session is not valid");
  }

  return toUserView(user);
}

/**
 * Change password: every session of the user ends, and this device gets a new one
 * @param {string} userId - User id of the session
 * @param {Object} body - Parsed passwordBody
 * @returns {Object} { user, token }
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new UnauthorizedError("Session is not valid");
  }

  // A field error and not 401: a mistyped password must not end the session
  if (!(await user.comparePassword(currentPassword))) {
    throw new ValidationError("Validation failed", { currentPassword: "incorrect" });
  }

  if (currentPassword === newPassword) {
    throw new ValidationError("Validation failed", { newPassword: "same_as_current" });
  }

  // The pre-save hook hashes it; only the password is checked, so a stored
  // role the app no longer has does not stop the change
  user.password = newPassword;
  await user.save({ validateModifiedOnly: true });

  await endUserSessions(userId);
  return { user: toUserView(user), token: await issueToken(userId) };
}

/**
 * Update user profile. A username someone else has answers 409 from the
 * unique index.
 * @param {string} userId - User id of the session
 * @param {Object} body - Parsed profileBody
 * @returns {Object} User view
 */
export async function updateProfile(userId, body) {
  const user = await User.findByIdAndUpdate(userId, body, {
    new: true,
    runValidators: true,
  }).lean();

  if (!user) {
    throw new UnauthorizedError("Session is not valid");
  }

  return toUserView(user);
}
