/**
 * Clean MVC Server
 * Simple, focused server implementation following MVC pattern
 */

import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'

// Middleware
import { errorHandler } from './middleware/errorHandler.js'

// Routes
import routes from './routes/index.js'

// Load environment variables
dotenv.config()

const app = express()

// =============================================================================
// SECURITY & MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet())

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)

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

const PORT = process.env.PORT || 5000
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore'

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully')
    console.log(`📚 Database: ${mongoose.connection.name}`)

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(50))
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🌐 API: http://localhost:${PORT}/api/v1`)
      console.log('='.repeat(50))
    })
  })
  .catch(error => {
    console.error('❌ MongoDB connection failed:', error.message)
    process.exit(1)
  })

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
