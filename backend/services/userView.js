/**
 * The public shape of a user: a string id, no password and no Mongoose
 * internals. The role is "admin" or "user": a role the app no longer has
 * (an older "moderator") reads as "user".
 */

export const roleOf = (user) => (user.role === "admin" ? "admin" : "user");

export function toUserView(doc) {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email,
    firstName: doc.firstName ?? null,
    lastName: doc.lastName ?? null,
    role: roleOf(doc),
    isActive: doc.isActive,
    lastLogin: doc.lastLogin ?? null,
    createdAt: doc.createdAt,
  };
}
