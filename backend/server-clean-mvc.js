/**
 * Clean MVC Server
 * Simple, focused server implementation following MVC pattern
 */

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

// Configuration
import { config, connectDatabase } from './config/index.js'

// Middleware
import { errorHandler } from './middleware/errorHandler.js'

// Routes
import routes from './routes/index.js'

const app = express()

// =============================================================================
// SECURITY & MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet())

// CORS
app.use(cors(config.cors))

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging (simple)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`)
  next()
})

// =============================================================================
// ROUTES
// =============================================================================

// API v1
app.use('/api/v1', routes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bookstore API - Clean MVC',
    version: '1.0.0',
    documentation: '/api/v1',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

// =============================================================================
// ERROR HANDLER (MUST BE LAST!)
// =============================================================================

app.use(errorHandler)

// =============================================================================
// DATABASE & SERVER START
// =============================================================================

/**
 * Initialize server
 * 1. Connect to database
 * 2. Start HTTP server
 */
async function startServer() {
  try {
    // Connect to database
    await connectDatabase()

    // Start server
    app.listen(config.port, () => {
      console.log('='.repeat(50))
      console.log(`🚀 Server running on port ${config.port}`)
      console.log(`📍 Environment: ${config.nodeEnv}`)
      console.log(`🌐 API: http://localhost:${config.port}/api/v1`)
      console.log('='.repeat(50))
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    process.exit(1)
  }
}

// Start the server
startServer()

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.error('❌ Unhandled Promise Rejection:', err)
  // Close server & exit process
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err)
  process.exit(1)
})

export default app
