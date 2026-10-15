import mongoose from "mongoose";
import config from "./default.js";

/**
 * Builds every index the models declare and waits for them. Mongoose builds
 * them in the background, one after another, without holding queries back;
 * an order is placed once per Idempotency-Key only because of a unique index,
 * so no request may run before it exists. Existing indexes are left as they are.
 */
export async function ensureIndexes() {
  await Promise.all(Object.values(mongoose.models).map((model) => model.createIndexes()));
}

export default async function connectDatabase() {
  try {
    await mongoose.connect(config.database.uri);
    console.log(`MongoDB: ${mongoose.connection.name}`);
    await ensureIndexes();

    mongoose.connection.on("error", (err) =>
      console.error("MongoDB error:", err.message)
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected")
    );
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
}
