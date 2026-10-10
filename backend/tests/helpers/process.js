/**
 * Child process helper
 * Tests that spawn Node build the child's environment with childEnv(), so the
 * child never inherits this machine's app or database settings (for example a
 * remote MONGODB_URI). Spawn with process.execPath and a temp cwd without .env.
 */

const DROPPED = new Set([
  "JWT_SECRET",
  "CORS_ORIGIN",
  "MONGODB_URI",
  "MONGODB_URL",
  "DATABASE_NAME",
  "PORT",
  "EXPOSE_ERROR_DETAILS",
]);

// Compared in upper case: Windows ignores the case of variable names
const isDropped = (name) => {
  const upper = name.toUpperCase();
  return DROPPED.has(upper) || upper.startsWith("SEED_");
};

// A copy of process.env without the dropped variables, then the overrides;
// an override value of undefined deletes the key
export function childEnv(overrides = {}) {
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !isDropped(name))
  );

  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete env[name];
    else env[name] = value;
  }

  return env;
}
