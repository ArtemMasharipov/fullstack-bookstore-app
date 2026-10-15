/**
 * Counter Model
 * Named sequences, one document per name. Incremented atomically with $inc.
 */

import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
);

export default mongoose.model("Counter", counterSchema, "counters");
