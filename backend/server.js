import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { connectDatabase } from './src/infrastructure/database/mongo.js'
import { setupErrorHandling } from './src/presentation/middleware/errorHandling.js'
import { setupMiddleware } from './src/presentation/middleware/setupMiddleware.js'
import { setupRoutes } from './src/presentation/routes/setupRoutes.js'

// Load environment variables
dotenv.config()

const app = express()

// Setup CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE').split(','),
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  })
)

// Setup middleware
setupMiddleware(app)

// Setup routes
setupRoutes(app)

// Setup error handling
setupErrorHandling(app)

// Setup database connection
connectDatabase()
  .then(() => {
    // Start the server
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch(error => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })

export default app
