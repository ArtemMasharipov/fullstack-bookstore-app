import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../../app.js";
import Author from "../../models/Author.js";
import { createUser, loginAs } from "../helpers/auth.js";
import { useTestDatabase } from "../helpers/db.js";
import { createAuthor } from "../helpers/factories.js";
import { meetingPoint } from "../helpers/race.js";

// One author per first and last name, compared without case but with
// diacritics: KAREL čapek is Karel Čapek, Karel Capek is another author
useTestDatabase();

const DUPLICATE = { code: "CONFLICT", fields: { lastName: "duplicate" } };

let token;
let meeting;

beforeEach(async () => {
  token = await loginAs(app, await createUser({ role: "admin" }));
  meeting = meetingPoint();
});

afterEach(() => {
  // A failed test leaves no request waiting
  meeting.open();
  vi.restoreAllMocks();
});

const send = (method, path, body) =>
  request(app)[method](`/api/v1/authors${path}`).set("Authorization", `Bearer ${token}`).send(body);
const statuses = (responses) => responses.map((res) => res.status).sort();
const refused = (responses) => responses.find((res) => res.status === 409).body.error;

describe("one author per name", () => {
  it("refuses a name that differs only in case, on create and update", async () => {
    await createAuthor();
    const other = await createAuthor({ firstName: "Jaroslav", lastName: "Hašek" });

    const created = await send("post", "", { firstName: "karel", lastName: "ČAPEK" });
    const renamed = await send("put", `/${other.id}`, { firstName: "KAREL", lastName: "čapek" });

    expect([created.status, renamed.status]).toEqual([409, 409]);
    expect(created.body.error).toMatchObject(DUPLICATE);
    expect(renamed.body.error).toMatchObject(DUPLICATE);
    expect(await Author.countDocuments()).toBe(2);
    expect((await Author.findById(other.id).lean()).lastName).toBe("Hašek");
  });

  it("refuses a name written in another Unicode normal form", async () => {
    await createAuthor();

    const res = await send("post", "", { firstName: "Karel", lastName: "Čapek".normalize("NFD") });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject(DUPLICATE);
  });

  it("accepts a name that differs in diacritics", async () => {
    await createAuthor();

    const res = await send("post", "", { firstName: "Karel", lastName: "Capek" });

    expect(res.status).toBe(201);
  });

  it("lets an author change the case of its own name", async () => {
    const author = await createAuthor();

    const res = await send("put", `/${author.id}`, { firstName: "KAREL", lastName: "ČAPEK" });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ firstName: "KAREL", lastName: "ČAPEK" });
  });

  it("a duplicate the fast path misses still answers 409 on lastName", async () => {
    await createAuthor();
    vi.spyOn(Author, "exists").mockResolvedValueOnce(null);

    const res = await send("post", "", { firstName: "Karel", lastName: "Čapek" });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject(DUPLICATE);
    expect(await Author.countDocuments()).toBe(1);
  });
});

// Both requests have checked for the name before either writes (see race.js)
describe("two requests for one name at the same moment", () => {
  it("two parallel creates of one name answer 201 and 409 on lastName", async () => {
    meeting.before(Author, "create");

    const responses = await Promise.all(
      [
        { firstName: "Karel", lastName: "Čapek" },
        { firstName: "karel", lastName: "čapek" },
      ].map((name) => meeting.track(send("post", "", name)))
    );

    expect(statuses(responses)).toEqual([201, 409]);
    expect(refused(responses)).toMatchObject(DUPLICATE);
    expect(await Author.countDocuments()).toBe(1);
  });

  it("two parallel renames to one free name answer 200 and 409 on lastName", async () => {
    const authors = [
      await createAuthor({ firstName: "Jaroslav", lastName: "Hašek" }),
      await createAuthor({ firstName: "Jan", lastName: "Neruda" }),
    ];
    meeting.before(Author, "findByIdAndUpdate");

    const responses = await Promise.all(
      authors.map((author) =>
        meeting.track(send("put", `/${author.id}`, { firstName: "Karel", lastName: "Čapek" }))
      )
    );

    expect(statuses(responses)).toEqual([200, 409]);
    expect(refused(responses)).toMatchObject(DUPLICATE);
    expect(await Author.countDocuments({ lastName: "Čapek" })).toBe(1);
  });
});
