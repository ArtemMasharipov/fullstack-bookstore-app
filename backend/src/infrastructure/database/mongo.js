import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

export const connectDatabase = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URL || 'mongodb://localhost:27017/bookstore'

    await mongoose.connect(mongoURI)

    console.log('MongoDB connected successfully')

    // Initialize default roles and admin user
    const { initializeDefaultData } = await import('./initialization.js')
    await initializeDefaultData()
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting from database:', error)
  }
}
