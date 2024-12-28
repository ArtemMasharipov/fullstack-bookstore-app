import express from 'express';
import { setupMiddleware } from './setup/middleware.mjs';
import { setupRoutes } from './setup/routes.mjs';
import { setupDatabase } from './setup/database.mjs';
import { setupErrorHandling } from './setup/error-handling.mjs';
import cors from 'cors';

const app = express();

// Setup CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS.split(','),
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  }),
);

// Setup middleware
setupMiddleware(app);

// Setup database connection
setupDatabase();

// Setup routes
setupRoutes(app);

// Setup error handling
setupErrorHandling(app);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export default app;
