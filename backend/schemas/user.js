/** Strict admin account updates. Account status has its own endpoint. */
import { z } from "zod";
import { limit, objectId, page, sortBy, text } from "./common.js";
import { email, name, newPassword, username } from "./userFields.js";
import { ROLES } from "../models/User.js";

export const USER_SORTS = ["-createdAt", "createdAt", "username", "-username", "email", "-email", "lastLogin", "-lastLogin"];
export const listUsersQuery = z.strictObject({
  page,
  limit: limit(100, 20),
  role: z.enum(ROLES).optional(),
  isActive: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  search: text(100).optional(),
  sortBy: sortBy(USER_SORTS, "-createdAt"),
});
export const createUserBody = z.strictObject({
  username, email, password: newPassword, role: z.enum(ROLES),
  firstName: name.optional(), lastName: name.optional(),
});

export const userIdParams = z.strictObject({ id: objectId });
export const emptyUserQuery = z.strictObject({});
export const updateUserBody = z.strictObject({
  username: username.optional(),
  email: email.optional(),
  firstName: name.optional(),
  lastName: name.optional(),
  role: z.enum(ROLES).optional(),
});
export const userStatusBody = z.strictObject({ isActive: z.boolean() });
