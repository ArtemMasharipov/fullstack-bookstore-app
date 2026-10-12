# 0002. Test infrastructure and a local-only database guard

- Status: accepted
- Date: 2026-10-10

## Context

The project had no automated tests and no CI: the backend `test` script only printed an error, and the frontend had
no test script. `server.js` built the Express app, connected to MongoDB and started listening as soon as it was
imported, so the app could not be tested on its own.

A developer's `backend/.env` may point at a remote database, even a production one. Tests, the demo-data seed and
end-to-end runs create and delete data, so they must never reach such a database, whatever `.env` says.

## Decision

- **Vitest in both packages.** The backend tests call `app.js` through Supertest; `app.js` was split out of
  `server.js` and neither listens nor connects. They run against a real MongoDB in memory instead of mocked models.
  The frontend tests run on happy-dom.
- **In-memory MongoDB.** mongodb-memory-server starts one MongoDB for the whole test run. The mongod version is pinned
  to 8.2.6 in `backend/package.json`, so an update of the package cannot change the server version silently. Each
  Vitest worker uses its own database, and collections are emptied after every test.
- **Local-only guard** (`config/mongo-guard.js`). The tests and the seed command check the URI before they connect
  and the connection after; the end-to-end server, which creates its own in-memory database, checks the connection:
  - before connecting, every host in the URI must be `localhost`, `127.0.0.1` or `::1`, and `mongodb+srv://` is
    refused. The credentials end at the first `@`, where the MongoDB driver ends them, so a remote host cannot hide
    in front of a later `@localhost`;
  - after connecting, the connection's host must be local as well. This is a second layer: Mongoose reports the first
    host of the URI as the driver parsed it, and it may already have created collections and indexes by then;
  - error messages never include the URI, the host or the credentials.
- **Seed.** `npm run seed` refuses a database that is not local unless `SEED_ALLOW_REMOTE=true` is set for that run.
  The flag is read from the process environment before `.env` is loaded, never from the file. `--reset` empties the
  users, authors and books only on a local database, even with the flag, and `seed()` checks this itself before it
  deletes anything.
- **End-to-end.** Playwright starts its own API on port 3100 (`npm run e2e:server`: an in-memory MongoDB with the demo
  data; it ignores `MONGODB_URI` and never reads `.env`) and `vite preview` on port 4173, both with
  `reuseExistingServer: false`. A dev stack on 3000 and 8080 is never reused, and a busy 3100 or 4173 fails the run.
- **Characterization tests** were written right after `app.js` was split out, before the backend's behavior changed.
  They record the API's correct behavior (health, registration and login, `/auth/me`, the book list and lookup,
  admin-only book creation) and are the safety net for the refactoring. They must not pin known defects.

## Consequences

- `npm test` needs neither a MongoDB of the developer's own nor `backend/.env`. The first run downloads a mongod
  binary into `~/.cache/mongodb-binaries`; later runs reuse it, and CI caches it.
- Test files run in parallel without sharing data.
- Tests, seeding and end-to-end runs cannot reach a remote database by accident. Seeding one takes an explicit flag on
  the command line and never works together with `--reset`.
- The guard fails closed: a password with a raw `@` must be percent-encoded as `%40`, as the URI format requires.
- The guard checks host names only. A tunnel or port forward that makes a remote server answer on `localhost` passes
  it.
- The tests of the SIGTERM and SIGINT handling run on Linux, in CI or in Docker; Windows skips them.
- The browser in the end-to-end run reaches its API through the `/api` proxy of the preview server
  ([decision 0003](0003-relative-api-base-url.md)).
