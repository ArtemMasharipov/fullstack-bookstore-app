/**
 * Limit of failed requests to the auth endpoints, per client: past
 * AUTH_RATE_LIMIT_MAX failures in AUTH_RATE_LIMIT_WINDOW_MINUTES the answer is
 * 429 RATE_LIMITED with Retry-After. Only failures count (status 400 and up):
 * signing in and the normal use of /auth never reach the limit, while guessing
 * passwords, probing for taken emails and guessing the current password do.
 * The client is req.ip, so behind a reverse proxy TRUST_PROXY has to say how
 * many proxies there are.
 */

import { MemoryStore, rateLimit } from "express-rate-limit";
import { config } from "../config/index.js";
import { AppError } from "../utils/errors.js";

// The counts live in this process; one store, so tests can reset it
const store = new MemoryStore();

export const authRateLimit = rateLimit({
  windowMs: config.authRateLimit.windowMinutes * 60 * 1000,
  limit: config.authRateLimit.max,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  store,
  // The library has set Retry-After already; the body carries the same seconds
  handler: (req, res, next) => {
    const retryAfter = Number(res.getHeader("Retry-After")) || 1;
    next(
      new AppError("Too many failed attempts", 429, "RATE_LIMITED", {
        details: { retryAfter },
      })
    );
  },
});

/** Forgets every count */
export const resetAuthRateLimit = () => store.resetAll();
