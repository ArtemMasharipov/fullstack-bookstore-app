/**
 * Loads backend/.env into process.env.
 * Only entry points (server.js, the seed CLI) import this, and they import it
 * first. app.js, config and tests never read .env, so a remote database URI
 * from it cannot reach them. Under NODE_ENV=test nothing is loaded.
 */

import dotenv from "dotenv";

if (process.env.NODE_ENV !== "test") dotenv.config();
