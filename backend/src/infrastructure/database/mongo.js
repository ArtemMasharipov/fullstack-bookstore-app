import dotenv from 'dotenv'
import mongoose from 'mongoose'
import logger from '../../utils/logger.js'

dotenv.config()

export const connectDatabase = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URL || 'mongodb://localhost:27017/bookstore'

    await mongoose.connect(mongoURI)

    logger.info('MongoDB connected successfully', { uri: mongoURI })

    // Initialize default roles and admin user
    const { initializeDefaultData } = await import('./initialization.js')
    await initializeDefaultData()
  } catch (error) {
    logger.error('Database connection failed', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    logger.info('MongoDB disconnected successfully')
  } catch (error) {
    logger.error('Error disconnecting from database', error)
  }
}
