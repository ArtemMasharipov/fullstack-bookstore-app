/**
 * Auth Service Layer
 * Handles authentication logic: register, login, password and profile; the
 * tokens come from sessions.js. Bodies arrive parsed by schemas/auth.js.
 */

import User from "../models/User.js";
import { ConflictError, UnauthorizedError, ValidationError } from "../utils/errors.js";
import { hashPassword, needsPasswordRehash, verifyLoginPassword, verifyPassword } from "../utils/passwords.js";
import { validateNewPassword } from "../utils/passwordPolicy.js";
import { credentialFilter, isCommittedUser, issueTokenForSnapshot } from "./sessions.js";
import { replacePassword } from "./accountCredentials.js";
import { toUserView } from "./userView.js";

/**
 * Register new user
 * @param {Object} body - Parsed registerBody
 * @returns {Object} { user, token }
 */
export async function register({ username, email, password, firstName, lastName }) {
  password = validateNewPassword(password, { username, email });
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ConflictError("Email already registered");
    }
    throw new ConflictError("Username already taken");
  }

  // The password is hashed by the pre-save hook
  const user = await User.create({ username, email, password, firstName, lastName, role: "user" });

  const issued = await issueTokenForSnapshot(user);
  return { user: toUserView(issued.user), token: issued.token };
}

/**
 * Login user
 * @param {Object} body - Parsed loginBody
 * @returns {Object} { user, token }
 */
export async function login({ emailOrUsername, password }) {
  const user = await User.findOne({
    $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }],
  }).select("+password").lean();

  // The password is checked in every case, against a dummy hash when there is
  // no account, so the time of the answer does not tell which case it was
  const passwordMatches = await verifyLoginPassword(password, user?.password);

  if (!user || !passwordMatches || !user.isActive || !isCommittedUser(user)) {
    throw new UnauthorizedError("Invalid credentials");
  }

  let expectedPassword = user.password;
  if (needsPasswordRehash(user.password)) {
    const modern = await hashPassword(password);
    const upgraded = await User.updateOne(credentialFilter(user), { $set: { password: modern } });
    if (upgraded.modifiedCount === 1) expectedPassword = modern;
    else {
      const current = await User.findById(user._id).select("+password").lean();
      // Another login may have upgraded this same revision. Never retry
      // through a password/access/logout-all revision change.
      if (!current || !isCommittedUser(current) || current.__v !== user.__v ||
          current.role !== user.role || current.isActive !== user.isActive ||
          needsPasswordRehash(current.password) || !(await verifyPassword(password, current.password))) {
        throw new UnauthorizedError("Invalid credentials");
      }
      expectedPassword = current.password;
    }
  }

  // A conditional update avoids saving an obsolete document or validating a
  // stored legacy role. It also returns the current profile for the response.
  const lastLogin = new Date();
  const current = await User.findOneAndUpdate(
    credentialFilter({ ...user, password: expectedPassword }),
    { $set: { lastLogin } },
    { new: true }
  ).select("+password").lean();
  if (!current) throw new UnauthorizedError("Invalid credentials");
  try {
    const issued = await issueTokenForSnapshot(current);
    return { user: toUserView(issued.user), token: issued.token };
  } catch (error) {
    if (error.code === "UNAUTHORIZED") throw new UnauthorizedError("Invalid credentials");
    throw error;
  }
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
export async function changePassword(userId, { currentPassword, newPassword }, sessionId) {
  const user = await User.findById(userId).select("+password").lean();

  if (!user) {
    throw new UnauthorizedError("Session is not valid");
  }

  // A field error and not 401: a mistyped password must not end the session
  if (!(await verifyPassword(currentPassword, user.password))) {
    throw new ValidationError("Validation failed", { currentPassword: "incorrect" });
  }

  if (await verifyPassword(newPassword, user.password)) {
    throw new ValidationError("Validation failed", { newPassword: "same_as_current" });
  }

  newPassword = validateNewPassword(newPassword, user, "newPassword");

  const result = await replacePassword(user, await hashPassword(newPassword), sessionId);
  return { user: toUserView(result.user), token: result.token };
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
