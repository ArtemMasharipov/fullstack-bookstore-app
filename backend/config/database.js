import mongoose from "mongoose";
import config from "./default.js";

/**
 * Builds every index the models declare and waits for them. Mongoose builds
 * them in the background, one after another, without holding queries back;
 * an order is placed once per Idempotency-Key only because of a unique index,
 * so no request may run before it exists. Existing indexes are left as they are.
 *
 * Documents stored before a unique index can break it: the index is then not
 * built, nothing changes and the server does not start. For the catalogue
 * identities the error names the command that lists those documents, instead
 * of the collation keys MongoDB reports.
 */
const IDENTITY_MODELS = new Set(["Author"]);

export async function ensureIndexes() {
  await Promise.all(
    Object.values(mongoose.models).map(async (model) => {
      try {
        await model.createIndexes();
      } catch (error) {
        if (error.code !== 11000 || !IDENTITY_MODELS.has(model.modelName)) throw error;
        throw new Error(
          `Existing duplicates in ${model.collection.collectionName} keep a unique index from being built; ` +
            "run npm run check:identities to list them",
          { cause: error }
        );
      }
    })
  );
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
