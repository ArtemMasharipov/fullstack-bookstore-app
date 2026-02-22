import dotenv from "dotenv";
dotenv.config();

const env = (key, fallback) => process.env[key] ?? fallback;

const dbUri = () => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const url = env("MONGODB_URL", "mongodb://localhost:27017").replace(
    /\/+$/,
    ""
  );
  return `${url}/${env("DATABASE_NAME", "bookStoreDB")}`;
};

export default Object.freeze({
  port: +env("PORT", 5000),
  nodeEnv: env("NODE_ENV", "development"),

  database: {
    uri: dbUri(),
  },

  jwt: {
    secret: env("JWT_SECRET", "your-secret-key"),
    expiresIn: env("JWT_EXPIRATION", "7d"),
    audience: env("JWT_AUDIENCE"),
    issuer: env("JWT_ISSUER"),
  },

  cors: {
    origin: env("CORS_ORIGIN", "*"),
    methods: env("CORS_METHODS", "GET,POST,PUT,PATCH,DELETE").split(","),
    credentials: env("CORS_CREDENTIALS") === "true",
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});
