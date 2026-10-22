import request from "supertest";
import { afterEach, expect, it, vi } from "vitest";
import app from "../../app.js";
import User from "../../models/User.js";
import { issueToken } from "../../services/sessions.js";
import { createUser } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";

useTestDatabase();
afterEach(() => vi.restoreAllMocks());
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const put = (token, id, body) => request(app).put(`/api/v1/users/${id}`)
  .set("Authorization", `Bearer ${token}`).send(body).then((answer) => answer);
const deactivate = (token, id) => request(app).patch(`/api/v1/users/${id}/status`)
  .set("Authorization", `Bearer ${token}`).send({ isActive: false }).then((answer) => answer);
async function admins() {
  const a = await createUser({ role: "admin" });
  const b = await createUser({ role: "admin" });
  return { a, b, aToken: await issueToken(a._id), bToken: await issueToken(b._id) };
}

it("keeps an active administrator when authorized demotions cross deactivations", async () => {
  const { a, b, aToken, bToken } = await admins();
  const statusReads = deferred(), statusReady = deferred();
  const roleReads = deferred(), roleReady = deferred();
  const counts = deferred(), countsReady = deferred();
  const find = User.findById.bind(User), exists = User.exists.bind(User);
  let reads = 0, checks = 0;
  vi.spyOn(User, "findById").mockImplementation((...args) => {
    const query = find(...args), exec = query.exec.bind(query), index = ++reads;
    query.exec = async (...execArgs) => {
      if (index <= 2) {
        if (index === 2) statusReady.resolve();
        await statusReads.promise;
      } else if (index <= 4) {
        if (index === 4) roleReady.resolve();
        await roleReads.promise;
      }
      return exec(...execArgs);
    };
    return query;
  });
  vi.spyOn(User, "exists").mockImplementation((...args) => {
    const query = exists(...args), exec = query.exec.bind(query);
    query.exec = async (...execArgs) => {
      if (++checks === 2) countsReady.resolve();
      await counts.promise;
      return exec(...execArgs);
    };
    return query;
  });
  const statuses = [deactivate(aToken, b._id), deactivate(bToken, a._id)];
  let roles = [];
  try {
    await statusReady.promise;
    roles = [put(aToken, b._id, { role: "user" }), put(bToken, a._id, { role: "user" })];
    await roleReady.promise;
    roleReads.resolve();
    await countsReady.promise;
    statusReads.resolve();
    await Promise.all(statuses);
  } finally {
    statusReads.resolve(); roleReads.resolve(); counts.resolve();
    await Promise.all([...statuses, ...roles]);
  }
  expect(await User.countDocuments({ role: "admin", isActive: true })).toBeGreaterThanOrEqual(1);
  expect(await User.countDocuments({ __v: { $lt: 0 } })).toBe(0);
});

it("never restores admin rights over an acknowledged same-value demotion", async () => {
  const { b, aToken, bToken } = await admins();
  const staged = deferred(), continueFirst = deferred();
  const exists = User.exists.bind(User);
  let calls = 0;
  vi.spyOn(User, "exists").mockImplementation((...args) => {
    const query = exists(...args), exec = query.exec.bind(query);
    if (++calls === 1) query.exec = async (...execArgs) => {
      staged.resolve();
      await continueFirst.promise;
      return exec(...execArgs);
    };
    return query;
  });
  const first = put(aToken, b._id, { role: "user", firstName: "First intent" });
  let second;
  try {
    await staged.promise;
    second = await put(aToken, b._id, { role: "user", firstName: "Newer intent" });
  } finally { continueFirst.resolve(); }
  const initial = await first;
  const accepted = [initial, second].filter((answer) => answer.status === 200);
  expect(accepted).toHaveLength(1);
  expect((await User.findById(b._id)).role).toBe("user");
  expect((await User.findById(b._id)).firstName).toBe(accepted[0].body.data.firstName);
  const oldSession = await request(app).get("/api/v1/users").set("Authorization", `Bearer ${bToken}`);
  expect(oldSession.status).toBe(401);
});

it("does not rely on a provisional promotion that may still be compensated", async () => {
  const { a, b, aToken, bToken } = await admins();
  const candidate = await createUser();
  const candidateToken = await issueToken(candidate._id);
  const actorReady = deferred(), readActor = deferred(), promotionReady = deferred(), finishPromotion = deferred();
  const profileReady = deferred(), readProfile = deferred();
  const find = User.findById.bind(User), write = User.findOneAndUpdate.bind(User), writeProfile = User.findByIdAndUpdate.bind(User);
  vi.spyOn(User, "findById").mockImplementation((id, ...args) => {
    const query = find(id, ...args), exec = query.exec.bind(query);
    if (String(id) === String(a._id)) query.exec = async (...execArgs) => {
      actorReady.resolve(); await readActor.promise; return exec(...execArgs);
    };
    return query;
  });
  vi.spyOn(User, "findByIdAndUpdate").mockImplementation((id, ...args) => {
    const query = writeProfile(id, ...args), exec = query.exec.bind(query);
    if (String(id) === String(candidate._id)) query.exec = async (...execArgs) => {
      profileReady.resolve(); await readProfile.promise; return exec(...execArgs);
    };
    return query;
  });
  vi.spyOn(User, "findOneAndUpdate").mockImplementation((filter, updates, ...args) => {
    const query = write(filter, updates, ...args), exec = query.exec.bind(query);
    if (String(filter._id) === String(candidate._id) && updates.$set?.role === "admin") {
      query.exec = async (...execArgs) => {
        const staged = await exec(...execArgs);
        promotionReady.resolve(); await finishPromotion.promise; return staged;
      };
    }
    return query;
  });
  const demotion = put(bToken, a._id, { role: "user" });
  const profile = request(app).put("/api/v1/auth/profile")
    .set("Authorization", `Bearer ${candidateToken}`).send({ firstName: "Newer profile" }).then((answer) => answer);
  let promotion;
  try {
    await Promise.all([actorReady.promise, profileReady.promise]);
    promotion = put(aToken, candidate._id, { role: "admin", firstName: "Provisional" });
    await promotionReady.promise;
    // No old user session may exercise provisional admin rights before commit.
    expect((await request(app).get("/api/v1/users").set("Authorization", `Bearer ${candidateToken}`)).status).toBe(409);
    expect((await put(aToken, b._id, { role: "user" })).status).toBe(200);
    readActor.resolve();
    await demotion;
    readProfile.resolve();
    expect((await profile).status).toBe(200);
  } finally {
    readActor.resolve(); readProfile.resolve(); finishPromotion.resolve();
    await Promise.all([demotion, promotion, profile]);
  }
  expect((await promotion).status).toBe(409);
  expect(await User.countDocuments({ role: "admin", isActive: true })).toBeGreaterThanOrEqual(1);
  expect((await User.findById(candidate._id)).firstName).toBe("Newer profile");
});

it.each([undefined, 0, 1])("accepts a committed legacy version %s and finishes session revocation", async (version) => {
  const { b, aToken, bToken } = await admins();
  await User.collection.updateOne({ _id: b._id }, version === undefined ? { $unset: { __v: "" } } : { $set: { __v: version } });
  const response = await put(aToken, b._id, { role: "user" });
  expect(response.status).toBe(200);
  expect((await User.findById(b._id)).__v).toBeGreaterThanOrEqual(0);
  expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${bToken}`)).status).toBe(401);
});

it("answers a pending deactivation with a retryable conflict, then revokes the session after commit", async () => {
  const { b, aToken, bToken } = await admins();
  const ready = deferred(), release = deferred();
  const write = User.findOneAndUpdate.bind(User);
  vi.spyOn(User, "findOneAndUpdate").mockImplementation((filter, updates, ...args) => {
    const query = write(filter, updates, ...args), exec = query.exec.bind(query);
    if (updates.$set?.isActive === false) query.exec = async (...execArgs) => {
      const staged = await exec(...execArgs);
      ready.resolve(); await release.promise; return staged;
    };
    return query;
  });
  const mutation = deactivate(aToken, b._id);
  try {
    await ready.promise;
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${bToken}`)).status).toBe(409);
  } finally { release.resolve(); await mutation; }
  expect((await mutation).status).toBe(200);
  expect((await request(app).get("/api/v1/auth/me").set("Authorization", `Bearer ${bToken}`)).status).toBe(401);
});
