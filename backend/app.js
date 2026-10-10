/**
 * Express Application
 * Security, parsing, logging, routes, 404 and error handling. It neither
 * listens on a port nor connects to a database, so tests can import it directly.
 */

import cors from "cors";
import express from "express";
import helmet from "helmet";

// Configuration
import { config } from "./config/index.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { createRequestLogger } from "./middleware/requestLogger.js";

// Routes
import routes from "./routes/index.js";

const app = express();

// =============================================================================
// SECURITY & MIDDLEWARE
// =============================================================================

// Security headers
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (method, path without query, status, duration); off in tests
if (config.nodeEnv !== "test") app.use(createRequestLogger());

// =============================================================================
// ROUTES
// =============================================================================

// API v1
app.use("/api/v1", routes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bookstore API - Clean MVC",
    version: "1.0.0",
    documentation: "/api/v1",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// =============================================================================
// ERROR HANDLER (MUST BE LAST!)
// =============================================================================

app.use(errorHandler);

export default app;
