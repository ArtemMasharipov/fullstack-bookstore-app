/**
 * Request schemas of the auth endpoints
 */

import { z } from "zod";
import { email, name, newPassword, username } from "./userFields.js";

// A new password; a stored one of any length still signs in
const anyPassword = z.string().min(1).max(1024);

export const registerBody = z.strictObject({
  username,
  email,
  password: newPassword,
  firstName: name.optional(),
  lastName: name.optional(),
});

export const loginBody = z.strictObject({
  emailOrUsername: z.string().trim().min(1).max(254),
  password: anyPassword,
});

export const passwordBody = z.strictObject({
  currentPassword: anyPassword,
  newPassword,
});

export const profileBody = z.strictObject({
  username: username.optional(),
  firstName: name.optional(),
  lastName: name.optional(),
});
