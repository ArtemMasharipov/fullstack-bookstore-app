/**
 * Application configuration
 * loadConfig(env) checks the environment and builds the config. It reads only
 * the object it is given, so tests pass their own. The default export is the
 * config of this process: importing it with an invalid environment throws a
 * ConfigError that lists every problem, so a misconfigured backend never starts.
 * An empty string counts as not set, for every variable.
 */

const NODE_ENVS = ["development", "test", "production"];

const MIN_PRODUCTION_SECRET_LENGTH = 32;

// The origin of the frontend dev server; the default outside production
const DEV_CORS_ORIGIN = "http://localhost:8080";

export class ConfigError extends Error {
  constructor(problems) {
    super(problems.join("\n"));
    this.name = "ConfigError";
    this.problems = problems;
  }
}

const read = (env, key, fallback) => {
  const value = env[key];
  return value === undefined || value === "" ? fallback : value;
};

// MONGODB_URI wins; otherwise MONGODB_URL (older form) + DATABASE_NAME
export function resolveMongoUri(env) {
  const uri = read(env, "MONGODB_URI");
  if (uri) return uri;

  const url = read(env, "MONGODB_URL", "mongodb://localhost:27017").replace(
    /\/+$/,
    ""
  );
  return `${url}/${read(env, "DATABASE_NAME", "bookStoreDB")}`;
}

export function loadConfig(env) {
  const problems = [];

  const nodeEnv = read(env, "NODE_ENV", "development");
  if (!NODE_ENVS.includes(nodeEnv)) {
    problems.push(`NODE_ENV must be one of: ${NODE_ENVS.join(", ")}`);
  }
  // An unknown NODE_ENV is reported above and otherwise treated as not production
  const isProduction = nodeEnv === "production";

  const portText = read(env, "PORT", "3000");
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || port > 65535) {
    problems.push("PORT must be an integer from 0 to 65535");
  }

  const jwtSecret = read(env, "JWT_SECRET");
  if (!jwtSecret) {
    problems.push("JWT_SECRET is required");
  } else if (isProduction && jwtSecret.length < MIN_PRODUCTION_SECRET_LENGTH) {
    problems.push(
      `JWT_SECRET must be at least ${MIN_PRODUCTION_SECRET_LENGTH} characters in production`
    );
  }

  const corsOrigin = read(
    env,
    "CORS_ORIGIN",
    isProduction ? undefined : DEV_CORS_ORIGIN
  );
  if (isProduction && (corsOrigin === undefined || corsOrigin === "*")) {
    problems.push("CORS_ORIGIN must be the site origin, not *, in production");
  }

  if (isProduction && !read(env, "MONGODB_URI") && !read(env, "MONGODB_URL")) {
    problems.push("MONGODB_URI (or MONGODB_URL) is required in production");
  }

  // Shop amounts in geller (1/100 CZK). The defaults are demo values for a
  // portfolio shop: books are zero-rated in Czechia, shipping follows them
  const wholeNumber = (key, fallback, max) => {
    const text = read(env, key, String(fallback));
    const value = Number(text);
    if (!/^\d+$/.test(text) || (max !== undefined && value > max)) {
      problems.push(
        `${key} must be a whole number from 0${max === undefined ? "" : ` to ${max}`}`
      );
    }
    return value;
  };
  const commerce = Object.freeze({
    currency: "CZK",
    vatRatePercent: wholeNumber("COMMERCE_VAT_RATE_PERCENT", 0, 100),
    shippingFee: wholeNumber("COMMERCE_SHIPPING_FEE", 9900),
    freeShippingThreshold: wholeNumber("COMMERCE_FREE_SHIPPING_THRESHOLD", 100000),
  });

  if (problems.length > 0) throw new ConfigError(problems);

  return Object.freeze({
    port,
    nodeEnv,

    database: {
      uri: resolveMongoUri(env),
    },

    jwt: {
      secret: jwtSecret,
      expiresIn: read(env, "JWT_EXPIRATION", "7d"),
      // Signed into every token and checked on every request
      audience: read(env, "JWT_AUDIENCE", "bookstore-web"),
      issuer: read(env, "JWT_ISSUER", "bookstore-api"),
    },

    cors: {
      origin: corsOrigin,
      methods: read(env, "CORS_METHODS", "GET,POST,PUT,PATCH,DELETE").split(","),
      credentials: env.CORS_CREDENTIALS === "true",
      allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    },

    // Never in production, whatever EXPOSE_ERROR_DETAILS says
    exposeErrorDetails: !isProduction && env.EXPOSE_ERROR_DETAILS === "true",

    commerce,
  });
}

export default loadConfig(process.env);
