/**
 * Global Error Handler Middleware
 * Handles all errors in the application
 * MUST be the last middleware in server.js
 */

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err)

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message),
    })
  }

  // Mongoose CastError (invalid ID format)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0]
    return res.status(409).json({
      success: false,
      error: `Duplicate value for field: ${field}`,
    })
  }

  // Our custom operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    })
  }

  // Unknown/programming errors - don't leak details in production
  const message =
    process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error'

  const statusCode = err.statusCode || 500

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
