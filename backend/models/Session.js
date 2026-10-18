/**
 * Session Model
 * One signed-in device: the id of its token (jti), the user and the moment the
 * token expires. A token is accepted only while its session exists, so
 * deleting the session ends the token at once. MongoDB deletes expired
 * sessions itself (TTL index).
 */

import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // The TTL monitor runs about once a minute, so a reader checks the time too
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("Session", sessionSchema);
