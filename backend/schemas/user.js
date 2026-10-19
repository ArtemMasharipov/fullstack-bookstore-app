/** Strict admin account updates. Account status has its own endpoint. */
import { z } from "zod";
import { objectId } from "./common.js";
import { email, name, username } from "./userFields.js";

export const userIdParams = z.strictObject({ id: objectId });
export const emptyUserQuery = z.strictObject({});
export const updateUserBody = z.strictObject({
  username: username.optional(),
  email: email.optional(),
  firstName: name.optional(),
  lastName: name.optional(),
  role: z.enum(["user", "admin"]).optional(),
});
export const userStatusBody = z.strictObject({ isActive: z.boolean() });
