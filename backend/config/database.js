import mongoose from 'mongoose'
import config from './default.js'

export default async function connectDatabase() {
  try {
    await mongoose.connect(config.database.uri)
    console.log(`MongoDB: ${mongoose.connection.name}`)

    mongoose.connection.on('error', err => console.error('MongoDB error:', err.message))
    mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'))

    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      process.exit(0)
    })
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    throw err
  }
}
