/**
 * Request schemas of the auth endpoints
 */

import { z } from "zod";

// The rules of the User model
const username = z
  .string()
  .trim()
  .min(3)
  .max(50)
  .regex(/^[a-zA-Z0-9_-]+$/);
const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const name = z.string().trim().max(50);

// A new password; a stored one of any length still signs in
const newPassword = z.string().min(6).max(1024);
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
