/**
 * Sessions
 * A token carries only the user id (sub) and the id of its session (jti), and
 * is signed for the configured audience and issuer. It is accepted while its
 * session exists and its user is active; the role comes from the database on
 * every request, never from the token. Ending a session ends its token.
 */

import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";
import { roleOf } from "./userView.js";

const OBJECT_ID = /^[0-9a-f]{24}$/i;

// One answer for every reason, so a caller learns nothing about which check failed
const notValid = () => new UnauthorizedError("Session is not valid");

/**
 * Starts a session for the user and returns its token
 * @param {string|ObjectId} userId
 * @returns {Promise<string>}
 */
export async function issueToken(userId) {
  const jti = randomUUID();
  const token = jwt.sign({}, config.jwt.secret, {
    algorithm: "HS256",
    subject: String(userId),
    jwtid: jti,
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
    expiresIn: config.jwt.expiresIn,
  });

  // The session ends when its token does; jsonwebtoken reads JWT_EXPIRATION
  const expiresAt = new Date(jwt.decode(token).exp * 1000);
  await Session.create({ jti, user: userId, expiresAt });
  return token;
}

/**
 * The user and the session of a token, or UnauthorizedError
 * @param {string} token
 * @returns {Promise<{ user: { id, username, email, role }, sessionId: string }>}
 */
export async function readSession(token) {
  let claims;
  try {
    claims = jwt.verify(token, config.jwt.secret, {
      algorithms: ["HS256"],
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
    });
  } catch {
    throw notValid();
  }

  const { sub, jti } = claims;
  if (typeof jti !== "string" || typeof sub !== "string" || !OBJECT_ID.test(sub)) throw notValid();

  const [session, user] = await Promise.all([
    Session.exists({ jti, user: sub, expiresAt: { $gt: new Date() } }),
    User.findOne({ _id: sub }).select("username email role isActive __v").lean(),
  ]);
  if (!session || !user) throw notValid();
  // A reserved access write is not an authoritative role snapshot yet. In
  // particular, an uncommitted promotion must never grant admin capabilities.
  if (user.__v < 0) throw new ConflictError("Account access is changing, retry the request");
  if (!user.isActive) throw notValid();

  return {
    user: { id: user._id.toString(), username: user.username, email: user.email, role: roleOf(user) },
    sessionId: jti,
  };
}

/** Ends one session: its token stops working */
export async function endSession(sessionId) {
  await Session.deleteOne({ jti: sessionId });
}

/** Ends every session of the user, on every device */
export async function endUserSessions(userId) {
  await Session.deleteMany({ user: userId });
}

/** A negative version belongs to an unfinished access or credential write. */
export function isCommittedUser(user) {
  return Boolean(user) && (user.__v === undefined || (Number.isSafeInteger(user.__v) && user.__v >= 0));
}

/** Exact credential/access revision; an absent legacy version is distinct from zero. */
export function credentialFilter(user) {
  return {
    _id: user._id,
    password: user.password,
    role: user.role === undefined ? { $exists: false } : user.role,
    isActive: user.isActive,
    __v: user.__v === undefined ? { $exists: false } : user.__v,
  };
}

/** Checks a token we just minted against its original committed account revision. */
export async function readIssuedUser(token, snapshot) {
  const claims = jwt.decode(token);
  if (!isCommittedUser(snapshot) || !snapshot.isActive || claims?.sub !== String(snapshot._id) || typeof claims?.jti !== "string") throw notValid();
  const [user, session] = await Promise.all([
    User.findOne(credentialFilter(snapshot)).lean(),
    Session.exists({ jti: claims.jti, user: snapshot._id, expiresAt: { $gt: new Date() } }),
  ]);
  if (!user || !session) throw notValid();
  return user;
}

/** Late inserts cannot outlive password changes, logout-all or access writes. */
export async function issueTokenForSnapshot(snapshot) {
  if (!isCommittedUser(snapshot) || !snapshot.isActive) throw notValid();
  const token = await issueToken(snapshot._id);
  try {
    return { user: await readIssuedUser(token, snapshot), token };
  } catch (error) {
    await endSession(jwt.decode(token).jti);
    throw error;
  }
}
