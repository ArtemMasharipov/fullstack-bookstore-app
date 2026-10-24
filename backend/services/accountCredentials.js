/** Credential writes share the access protocol's existing MongoDB revision. */
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { credentialFilter, endSession, endUserSessions, isCommittedUser, issueToken, readIssuedUser } from "./sessions.js";

const conflict = () => new ConflictError("The account changed meanwhile, retry the request");
const notValid = () => new UnauthorizedError("Session is not valid");

async function claim(snapshot, sessionId, changes = {}, checkIdentity = false) {
  if (!isCommittedUser(snapshot)) throw conflict();
  if (!snapshot.isActive) throw notValid();
  const next = (snapshot.__v ?? 0) + 1;
  if (!Number.isSafeInteger(next)) throw conflict();
  const live = typeof sessionId === "string" && await Session.exists({ jti: sessionId, user: snapshot._id, expiresAt: { $gt: new Date() } });
  if (!live) {
    // A competing rotation can revoke the authorizing session after protect
    // accepted it. This is a stale write (409), not a new sign-in failure.
    const current = await User.findOne(credentialFilter(snapshot)).lean();
    if (!current) throw conflict();
    throw notValid();
  }
  const filter = credentialFilter(snapshot);
  if (checkIdentity) Object.assign(filter, { username: snapshot.username, email: snapshot.email });
  const reserved = await User.findOneAndUpdate(
    filter,
    { $set: { ...changes, __v: -next } },
    { new: true, runValidators: true }
  ).select("+password").lean();
  if (!reserved) throw conflict();
  return { reserved, next };
}

async function commit(reserved, next) {
  const result = await User.updateOne(credentialFilter(reserved), { $set: { __v: next } });
  if (result.modifiedCount !== 1) throw conflict();
}

export async function replacePassword(snapshot, nextHash, sessionId) {
  const { reserved, next } = await claim(snapshot, sessionId, { password: nextHash }, true);
  let token;
  try {
    await endUserSessions(snapshot._id);
    token = await issueToken(snapshot._id);
    await commit(reserved, next);
    return { user: await readIssuedUser(token, { ...reserved, __v: next }), token };
  } catch (error) {
    if (token) await endSession(jwt.decode(token).jti);
    // Never restore an old credential or sessions. An interrupted reservation
    // needs operator recovery, as with the existing access-write protocol.
    throw error;
  }
}

export async function revokeAllSessions(userId, sessionId) {
  const snapshot = await User.findById(userId).select("+password").lean();
  if (!snapshot) throw notValid();
  const { reserved, next } = await claim(snapshot, sessionId);
  await endUserSessions(userId);
  await commit(reserved, next);
}
