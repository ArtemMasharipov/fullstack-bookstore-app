import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { connectDatabase } from './src/infrastructure/database/mongo.js'
import { setupErrorHandling } from './src/presentation/middleware/errorHandling.js'
import { setupMiddleware } from './src/presentation/middleware/setupMiddleware.js'
import { setupRoutes } from './src/presentation/routes/setupRoutes.js'
import logger, { errorLogger, requestLogger } from './src/utils/logger.js'

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

// Add request logging
app.use(requestLogger)

// Setup routes
setupRoutes(app)

// Add error logging
app.use(errorLogger)

// Setup error handling
setupErrorHandling(app)

// Setup database connection
connectDatabase()
  .then(() => {
    // Start the server
    const PORT = process.env.PORT || 3000
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
    })
  })
  .catch(error => {
    logger.error('Failed to start server', error)
    process.exit(1)
  })

export default app
