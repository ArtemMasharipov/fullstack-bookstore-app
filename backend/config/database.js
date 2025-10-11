/**
 * Database Connection Module
 * Handles MongoDB connection setup and configuration
 */

import mongoose from 'mongoose'
import config from './default.js'

// Set global promises
mongoose.Promise = global.Promise

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    await mongoose.connect(config.database.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('✅ MongoDB connected successfully')
    console.log(`📚 Database: ${mongoose.connection.name}`)

    // Handle connection events
    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected')
    })

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('MongoDB connection closed through app termination')
      process.exit(0)
    })
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message)
    throw err
  }
}

export default connectDatabase
