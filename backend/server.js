/**
 * Clean MVC Server
 * Simple, focused server implementation following MVC pattern
 */

// Configuration
import { config, connectDatabase } from "./config/index.js";

// Application
import app from "./app.js";

// =============================================================================
// DATABASE & SERVER START
// =============================================================================

/**
 * Initialize server
 * 1. Connect to database
 * 2. Start HTTP server
 */
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    // Start server
    app.listen(config.port, () => {
      console.log("=".repeat(50));
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🌐 API: http://localhost:${config.port}/api/v1`);
      console.log("=".repeat(50));
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

export default app;
