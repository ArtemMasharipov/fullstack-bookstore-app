/**
 * Clean MVC Server
 * Simple, focused server implementation following MVC pattern
 */

// Must stay the first import: it loads backend/.env before any other module
// reads process.env
import "./config/load-env.js";

import mongoose from "mongoose";

// Configuration and application. config/default.js validates the environment
// when it is imported (app.js imports it too), so both are loaded here and not
// with static imports: an invalid configuration is printed as its list of
// problems, not as an uncaught error, and stops the process before it starts.
let config;
let connectDatabase;
let app;

try {
  ({ config, connectDatabase } = await import("./config/index.js"));
  ({ default: app } = await import("./app.js"));
} catch (error) {
  if (error.name !== "ConfigError") throw error;
  console.error(error.message);
  process.exit(1);
}

// =============================================================================
// DATABASE & SERVER START
// =============================================================================

let server;

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
    server = app.listen(config.port, () => {
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

// =============================================================================
// SHUTDOWN
// =============================================================================

let shuttingDown = false;

// Hard deadline for any shutdown (signal or fatal error). A request that never
// completes would keep server.close() waiting forever, leaving a process that
// neither listens nor exits.
const SHUTDOWN_TIMEOUT_MS = 10_000;

// Stops accepting connections and waits for in-flight requests to finish. A
// server that was never started has nothing to close, and one that failed to
// listen reports ERR_SERVER_NOT_RUNNING: neither needs waiting for.
const closeServer = () =>
  new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => resolve());
  });

/**
 * Graceful shutdown: HTTP server, then database, then exit.
 * Idempotent: the first call wins, later ones (a second signal, an error
 * while shutting down) are ignored. Safe before the server exists. Bounded by
 * SHUTDOWN_TIMEOUT_MS: if cleanup has not finished by then, exits with 1.
 */
async function shutdown(signal, exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  // unref(): the timer never keeps an otherwise finished process alive
  setTimeout(() => {
    console.error("shutdown timed out");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  console.log(`Shutting down (${signal})`);

  try {
    await closeServer();
    // close() on a connection that is still connecting waits for that attempt
    // to end (up to 30 s), so a signal during startup would hang here
    if (mongoose.connection.readyState !== mongoose.STATES.connecting) {
      await mongoose.disconnect();
    }
    console.log("shutdown complete");
  } catch (error) {
    console.error("❌ Shutdown failed:", error);
    exitCode = 1;
  }

  process.exit(exitCode);
}

process.on("SIGTERM", () => shutdown("SIGTERM", 0));
process.on("SIGINT", () => shutdown("SIGINT", 0));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  shutdown("unhandledRejection", 1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  shutdown("uncaughtException", 1);
});

// Start the server
startServer();

export default app;
