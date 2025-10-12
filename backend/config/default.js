/**
 * Default Configuration
 * Centralized configuration management for the application
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const config = Object.freeze({
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database Configuration
  database: {
    name: process.env.DATABASE_NAME || 'bookStoreDB',
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    // Full MongoDB URI
    get uri() {
      // If MONGODB_URI is provided, use it directly
      if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI
      }
      // Otherwise construct from URL and NAME
      return `${this.url}/${this.name}`
    },
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: (process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE').split(
      ','
    ),
    credentials: process.env.CORS_CREDENTIALS === 'true',
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'default-session-secret',
  },
})

export default config
