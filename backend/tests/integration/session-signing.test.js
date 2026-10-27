import { SignJWT } from "jose";
import request from "supertest";
import { afterEach, expect, it, vi } from "vitest";
import app from "../../app.js";
import Session from "../../models/Session.js";
import User from "../../models/User.js";
import { replacePassword } from "../../services/accountCredentials.js";
import { issueToken, issueTokenForSnapshot, readSession } from "../../services/sessions.js";
import { UnauthorizedError } from "../../utils/errors.js";
import { hashPassword } from "../../utils/passwords.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { decodeJwtFixture } from "../helpers/jwt.js";

useTestDatabase();
afterEach(() => vi.restoreAllMocks());

const stored = id => User.findById(id).select("+password").lean();
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

it("does not create a session when async signing rejects", async () => {
  const user = await createUser();
  const before = await Session.countDocuments({ user: user._id });
  const signError = new Error("Test signing failure");
  vi.spyOn(SignJWT.prototype, "sign").mockRejectedValueOnce(signError);

  const caught = await issueToken(user._id).then(() => null, error => error);
  const after = await Session.countDocuments({ user: user._id });

  expect(caught).toBe(signError);
  expect(after).toBe(before);
});

it("preserves a DB error after valid verification", async () => {
  const user = await createUser();
  const token = await issueToken(user._id);
  const dbError = new Error("Test session database failure");
  vi.spyOn(Session, "exists").mockRejectedValueOnce(dbError);

  const caught = await readSession(token).then(() => null, error => error);

  expect(caught).toBe(dbError);
});

it("rejects a stale snapshot after signing resumes without deleting another session", async () => {
  const user = await createUser();
  const actorToken = await issueToken(user._id);
  const snapshot = await stored(user._id);
  const entered = deferred(), release = deferred();
  const sign = SignJWT.prototype.sign;
  vi.spyOn(SignJWT.prototype, "sign").mockImplementationOnce(async function (...args) {
    entered.resolve();
    await release.promise;
    return sign.apply(this, args);
  });
  const pending = issueTokenForSnapshot(snapshot).then(value => ({ value }), error => ({ error }));
  let independent;
  try {
    await entered.promise;
    const response = await request(app).delete("/api/v1/auth/sessions").set("Authorization", `Bearer ${actorToken}`);
    expect(response.status).toBe(204);
    independent = await issueTokenForSnapshot(await stored(user._id));
  } finally {
    release.resolve();
    await pending;
  }

  expect((await pending).error).toBeInstanceOf(UnauthorizedError);
  expect(await Session.countDocuments({ user: user._id })).toBe(1);
  const independentId = decodeJwtFixture(independent.token).jti;
  expect((await readSession(independent.token)).sessionId).toBe(independentId);
  expect(await Session.exists({ jti: decodeJwtFixture(actorToken).jti })).toBeNull();
});

it("keeps interrupted password reservation on replacement sign failure", async () => {
  const user = await createUser();
  const token = await issueToken(user._id);
  const snapshot = await stored(user._id);
  const nextHash = await hashPassword("Velvet compass 92!");
  const signError = new Error("Test replacement signing failure");
  vi.spyOn(SignJWT.prototype, "sign").mockRejectedValueOnce(signError);

  const caught = await replacePassword(snapshot, nextHash, decodeJwtFixture(token).jti).then(() => null, error => error);

  expect(caught).toBe(signError);
  expect(await Session.countDocuments({ user: user._id })).toBe(0);
  const after = await stored(user._id);
  expect(after.password).toBe(nextHash);
  expect(after.password).not.toBe(snapshot.password);
  expect(after.__v).toBeLessThan(0);
});
