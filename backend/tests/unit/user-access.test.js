import { beforeEach, describe, expect, it, vi } from "vitest";

// A controlled interleaving at the storage boundary. HTTP integration tests
// exercise the actual model and database; these pin the order of compensation.
const storage = vi.hoisted(() => ({ row: null, afterAccess: null }));
vi.mock("../../models/User.js", () => {
  const query = (value) => Object.assign(Promise.resolve(value), {
    select() { return this; }, lean() { return this; },
  });
  const matches = (filter) => Object.entries(filter).every(([key, value]) =>
    value === storage.row[key] || (value === null && storage.row[key] === undefined));
  const write = (filter, updates) => {
    if (!matches(filter)) return query(null);
    Object.assign(storage.row, updates.$set ?? updates);
    return query({ ...storage.row });
  };
  return {
    ROLES: ["user", "admin"],
    default: {
      findById: () => query({ ...storage.row }),
      findOne: () => query(null),
      findByIdAndUpdate: (id, updates) => write({ _id: id }, updates),
      findOneAndUpdate: write,
      updateOne: (filter, updates) => write(filter, updates),
      exists: async () => storage.afterAccess(),
    },
  };
});
const sessions = vi.hoisted(() => ({ ended: [] }));
vi.mock("../../services/sessions.js", () => ({ endUserSessions: async (id) => sessions.ended.push(id) }));
import { updateUser } from "../../services/userService.js";

const ORIGINAL = { _id: "target", username: "original", email: "original@example.com",
  firstName: "Jan", lastName: "Novák", role: "admin", isActive: true };
const PROFILE = { username: "rejected", email: "rejected@example.com", firstName: "Rejected", lastName: "Rejected" };
beforeEach(() => {
  storage.row = { ...ORIGINAL };
  storage.afterAccess = () => null;
  sessions.ended = [];
});

describe("access change compensation", () => {
  it("rejects LAST_ADMIN before writing the profile", async () => {
    await expect(updateUser("target", { role: "user", ...PROFILE }, "actor"))
      .rejects.toMatchObject({ code: "LAST_ADMIN" });
    expect(storage.row).toEqual(ORIGINAL);
    expect(sessions.ended).toEqual([]);
  });

  it("preserves a newer profile while undoing its access change", async () => {
    storage.afterAccess = () => { storage.row.firstName = "A newer name"; return null; };
    await expect(updateUser("target", { role: "user", ...PROFILE }, "actor"))
      .rejects.toMatchObject({ code: "LAST_ADMIN" });
    expect(storage.row).toEqual({ ...ORIGINAL, firstName: "A newer name" });
    expect(sessions.ended).toEqual([]);
  });

  it("does not replace a newer access state when compensation no longer matches", async () => {
    storage.afterAccess = () => { storage.row.role = "admin"; storage.row.isActive = false; return null; };
    await expect(updateUser("target", { role: "user" }, "actor"))
      .rejects.toMatchObject({ code: "LAST_ADMIN" });
    expect(storage.row).toEqual({ ...ORIGINAL, isActive: false });
  });

  it("refuses to overwrite a competing profile and compensates its role change", async () => {
    storage.afterAccess = () => { storage.row.firstName = "A newer name"; return { _id: "actor" }; };
    await expect(updateUser("target", { role: "user", firstName: "Rejected" }, "actor"))
      .rejects.toMatchObject({ code: "CONFLICT" });
    expect(storage.row).toEqual({ ...ORIGINAL, firstName: "A newer name" });
    expect(sessions.ended).toEqual([]);
  });
});
