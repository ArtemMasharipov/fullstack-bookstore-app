/**
 * Async Handler Wrapper
 * Wraps async controller functions to catch errors and pass to error handler
 * 
 * Usage:
 * router.get('/', asyncHandler(async (req, res) => { ... }))
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
