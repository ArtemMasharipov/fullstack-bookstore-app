/**
 * Authentication Middleware
 * Protects routes and authorizes based on user roles
 */

import { readSession } from "../services/sessions.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

/**
 * Protect routes: the Bearer token must belong to a live session of an active
 * user. req.user gets that user as the database has it ({ id, username, email,
 * role }), req.sessionId the session of the token.
 */
export const protect = async (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedError("Authentication required");
    }

    const { user, sessionId } = await readSession(token);
    req.user = user;
    req.sessionId = sessionId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize specific roles
 * Usage: authorize('admin'), authorize('admin', 'moderator')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError("Access denied. Please log in."));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role ${req.user.role} is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};
