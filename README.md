# Fullstack Bookstore App

A bookstore web application: a Vue 3 single-page frontend and a Node.js REST API on MongoDB.

**Frontend:** Vue 3, Pinia, Vuetify 3, Vue Router 4, Vite

**Backend:** Node.js 24, Express 4, MongoDB, Mongoose, JWT

This file is the current developer documentation. The backend API routes are listed in
[`backend/README.md`](backend/README.md). In the code blocks below, every `cd` starts from the repository root.

## Requirements

- **Node.js 24** (`.nvmrc` is `24`; both packages declare `engines.node` `24.x`) and the npm that comes with it.
  Node 25 and newer are not supported: `jsonwebtoken` depends on `SlowBuffer`, which Node 25 removed, so the backend
  does not start there. Install Node 24 with one of:
  - [fnm](https://github.com/Schniz/fnm): `fnm install` then `fnm use` (both read `.nvmrc`);
  - [nvm-windows](https://github.com/coreybutler/nvm-windows): `nvm install 24` then `nvm use 24`;
  - [volta](https://volta.sh): `volta install node@24`;
  - no local Node 24 at all: see [Docker variant](#docker-variant-of-node-24).

  Check with `node -v` (it must print `v24.x.x`).
- **MongoDB**, reachable from your machine. Either an installation of your own, or one in Docker:

  ```bash
  docker run -d --name bookstore-mongo -p 127.0.0.1:27017:27017 mongo:7.0
  ```

  The examples below use `mongodb://127.0.0.1:27017/bookstore`. For a database on another port, change
  `MONGODB_URI` in `backend/.env`.

## Install

Each package has its own `package.json` and lock file. Install both with `npm ci`:

```bash
git clone <repository-url>
cd fullstack-bookstore-app

cd backend
npm ci
cd ../frontend
npm ci
cd ..
```

## Configure

From the repository root, copy the backend example. Skip this if you already have a `backend/.env`; the commands below
do not overwrite one:

```bash
cp -n backend/.env.example backend/.env
```

```powershell
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

`JWT_SECRET` is empty in the example, and the backend and the seed command refuse to start without it. Generate a
secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then open `backend/.env` and paste the output after `JWT_SECRET=`. Do this before `npm run dev` and `npm run seed`.

`backend/.env` is git-ignored; never commit it. Variables of `backend/.env` (all are in `backend/.env.example`):

| Variable                                      | Meaning                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                    | `development`, `test` or `production`; default `development`                                                   |
| `PORT`                                        | API port; default `3000`                                                                                       |
| `MONGODB_URI`                                 | MongoDB connection string. Not set: `mongodb://localhost:27017/bookStoreDB`. Required in production (the older `MONGODB_URL` + `DATABASE_NAME` pair also works) |
| `JWT_SECRET`                                  | **Required in every environment**, empty in the example; at least 32 characters in production                  |
| `JWT_EXPIRATION`                              | Token lifetime; default `7d`                                                                                   |
| `CORS_ORIGIN`                                 | Allowed browser origin. Default `http://localhost:8080` outside production; **required, and not `*`, in production** |
| `CORS_METHODS`, `CORS_CREDENTIALS`            | Optional; defaults `GET,POST,PUT,PATCH,DELETE` and `false`                                                     |
| `EXPOSE_ERROR_DETAILS`                        | `true` puts error messages and stack traces into API responses. Honoured only outside production              |
| `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD`   | Passwords for `npm run seed` (see [Seed](#seed-demo-data))                                                     |
| `SEED_ALLOW_REMOTE`                           | `true` allows seeding a database that is not local. Never read from `backend/.env`: set it in the shell for one run (see [Seed](#seed-demo-data)) |

How the configuration behaves:

- It is validated when the backend starts. An invalid value stops the process with a list of every problem.
- An empty value (`JWT_SECRET=`) counts as not set.
- `backend/.env` is read only by `server.js` (`npm start`, `npm run dev`) and by the seed command, and only from the
  current directory (run them from `backend/`). Tests and the e2e server never read it, so they cannot reach the
  database written there. A variable already set in your shell wins over `.env`.

The frontend needs no configuration for development. Its API base URL is `/api/v1`, unless `VITE_API_URL` is set when
the dev server starts or the app is built. To change it, copy `frontend/.env.example` to `frontend/.env` if you have
none yet, and edit the value there.

## Run

Start the backend and the frontend in two terminals. MongoDB must be running.

```bash
# terminal 1
cd backend
npm run dev      # nodemon, restarts when source files change (not .env, see below); `npm start` runs it once without nodemon
```

nodemon does not watch `backend/.env` (it watches `.js`, `.mjs`, `.cjs` and `.json` files). After you edit `.env`, type
`rs` and press Enter in the nodemon terminal, or stop it with Ctrl+C and run `npm run dev` again. The same applies when
the backend stopped at startup on a configuration error, for example a missing `JWT_SECRET`: nodemon then prints
`app crashed - waiting for file changes before starting...` and does not notice the `.env` edit, so restart it by hand.

The API listens on http://localhost:3000. Check it:

```bash
curl http://localhost:3000/api/v1/health
```

It answers `200` with `{"success":true,"message":"API is running",...}`. In Windows PowerShell use `curl.exe`: plain
`curl` is an alias of `Invoke-WebRequest` there.

```bash
# terminal 2
cd frontend
npm run dev
```

The frontend is at http://localhost:8080 (the dev server opens the browser itself); the catalogue is at `/books`.
`npm run dev` proxies every `/api` request to `http://localhost:3000`. If the API runs elsewhere, set
`API_PROXY_TARGET` in the shell before starting it; it is read from the process environment, not from `.env` files:

```bash
API_PROXY_TARGET=http://localhost:3001 npm run dev
```

```powershell
$env:API_PROXY_TARGET = 'http://localhost:3001'; npm run dev
```

The catalogue is empty until you seed the database (next section).

`SIGINT` (Ctrl+C) and `SIGTERM` stop the backend gracefully: the HTTP server, then the database connection, with a
10 second deadline. A clean stop ends the log with `shutdown complete`. On Windows Node does not deliver `SIGTERM` to
its handlers; Ctrl+C works there.

## Seed demo data

`npm run seed` creates 2 users (`admin@bookstore.local` with the `admin` role and `reader@bookstore.local`),
5 authors and 24 books. They are test data for checking the layout, not a real catalogue.

```bash
cd backend
SEED_ADMIN_PASSWORD='choose-a-password' SEED_USER_PASSWORD='choose-another-one' npm run seed
```

PowerShell:

```powershell
cd backend
$env:SEED_ADMIN_PASSWORD = 'choose-a-password'; $env:SEED_USER_PASSWORD = 'choose-another-one'; npm run seed
```

It prints `Seeded 2 users, 5 authors, 24 books` and exits with code 0. Rules of the seed command:

- **Passwords** come from `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` (the shell or `backend/.env`; at least 6
  characters). If one is not set, it is generated and printed once, but only in an interactive terminal. Without a
  terminal (a script, CI) a missing password is an error.
- **It needs `JWT_SECRET` too:** the command loads the validated configuration, so generate and set it as described
  in [Configure](#configure).
- **Target database:** `MONGODB_URI`. With no database settings at all it uses `mongodb://localhost:27017/bookStoreDB`.
- **Only a local database** (`localhost`, `127.0.0.1`, `::1`). Any other host is refused unless
  `SEED_ALLOW_REMOTE=true` is set in the shell for that one run (`SEED_ALLOW_REMOTE=true npm run seed`). It is never
  read from `backend/.env`, so a value kept there has no effect.
- **A seeded database is refused:** running the command again prints `Database already seeded; run with --reset`.
- **`--reset`** deletes all users, authors and books first, then seeds again. Carts and orders are not touched. It works
  only on a local database, even with `SEED_ALLOW_REMOTE=true`. Pass the flag after `--`, otherwise npm swallows it:

  ```bash
  npm run seed -- --reset
  ```

After seeding, reload http://localhost:8080/books: the first 12 books are listed (see
[Known limitations](#known-limitations)).

## Tests

Run each package's tests from its directory. None of them needs `backend/.env` or a MongoDB of your own.

```bash
cd backend
npm test        # vitest + mongodb-memory-server
cd ../frontend
npm test        # vitest + happy-dom
```

- **Backend.** Tests run against an in-memory MongoDB. The first run downloads a `mongod` binary of several hundred MB
  into `~/.cache/mongodb-binaries` (its version is pinned in `backend/package.json`, `config.mongodbMemoryServer`), so it
  needs network access and some minutes; later runs reuse it. The tests of the SIGTERM/SIGINT shutdown are skipped on
  Windows and run in CI and in Docker.
- **E2E smoke** (Playwright, Chromium): the catalogue shows a seeded book and opens its page.

  ```bash
  cd frontend
  npx playwright install chromium     # once; on Linux add --with-deps
  npm run test:e2e
  ```

  It starts its own stack: the API on port 3100 (in-memory MongoDB, seeded; it never uses the database of
  `backend/.env`) and `vite preview` of a fresh build on port 4173. It needs `npm ci` in `backend/` as well. It fails if
  port 3100 or 4173 is busy and never reuses a running dev server. It rebuilds `dist/`. The HTML report goes to
  `frontend/playwright-report/`.

CI (`.github/workflows/ci.yml`) runs three jobs: `backend` (`npm ci`, `npm test`), `frontend` (`npm ci`, `lint`,
`format:check`, `test`, `build`) and `e2e`.

## Build

```bash
cd frontend
npm run build       # writes to dist/ in the repository root, not to frontend/dist
npm run preview     # serves the build on port 4173 and proxies /api like the dev server does
```

The build calls `/api/v1` of the host that serves it. To serve the build somewhere without a reverse proxy for `/api`,
set `VITE_API_URL` to the full API URL when building. It is baked into the bundle.

## Lint and format

Frontend only (the backend has none yet; it is planned for stage 5 of the roadmap):

```bash
cd frontend
npm run lint            # ESLint, only checks
npm run format:check    # Prettier, only checks
npm run lint:fix        # ESLint --fix, changes files
npm run format          # Prettier --write, changes files
```

## Docker variant of Node 24

If you cannot install Node 24 on the host, run npm in a `node:24` container. Keep `node_modules` in a separate Docker
volume: the one in your working tree was installed on the host, and native packages such as `bcrypt` built for Windows
do not load on Linux. From the repository root (bash; in Git Bash on Windows prefix the command with
`MSYS_NO_PATHCONV=1` and write `$PWD` as a full path such as `D:/path/to/fullstack-bookstore-app`):

```bash
docker run --rm \
  -v "$PWD/backend:/app" -v bookstore-backend-nm:/app/node_modules \
  -w /app node:24-bookworm-slim \
  sh -c "apt-get update -qq && apt-get install -y -qq --no-install-recommends libcurl4 && npm ci && npm test"
```

`libcurl4` is needed because the slim image lacks it and the `mongod` binary used by the tests will not start without
it. The same applies to the frontend (`esbuild` and `rollup` ship platform-specific binaries): give it its own
volume, for example `bookstore-frontend-nm`. To run the server from a container, also publish the port (`-p 3000:3000`)
and point `MONGODB_URI` at a MongoDB the container can reach.

## Project structure

```
.nvmrc                      # Node version (24)
.github/workflows/ci.yml    # CI: backend, frontend and e2e jobs
backend/                    # Express API (ESM)
├── app.js                  # the Express app; does not listen or connect, so tests import it
├── server.js               # entry point: loads .env, connects to MongoDB, listens, shuts down gracefully
├── config/                 # validated configuration, DB connection, .env loader, local-database guard
├── routes/                 # route definitions (list in backend/README.md)
├── controllers/            # HTTP handlers
├── services/               # business logic
├── models/                 # Mongoose schemas
├── middleware/             # auth, error handling, request logging
├── utils/                  # helpers
├── scripts/                # seed command and data, e2e server
├── tests/                  # vitest: unit and integration
└── docs/                   # historical notes, not maintained
frontend/                   # Vue 3 SPA (Vite)
├── src/                    # components, views, stores (Pinia), services (API), router, styles
├── e2e/                    # Playwright smoke test
└── public/                 # static files
docs/                       # project overhaul documents (audit, roadmap, specs)
dist/                       # frontend build output (git-ignored)
```

## Known limitations

The application is mid-overhaul. The current state is in
[`docs/project-overhaul/STATUS.md`](docs/project-overhaul/STATUS.md), the stages named below are in
[`docs/project-overhaul/03-backlog.md`](docs/project-overhaul/03-backlog.md). Today:

- Checkout and order history do not work (stage 1A); the admin panel does not work either (stage 2).
- The catalogue shows the first 12 books only: the pager stays hidden (stage 1B).
- `npm audit` reports vulnerable dependencies in both packages (dependency update: stage 4).
- The seed data is for layout checks; there is no real catalogue yet.

## Copyright

Copyright (c) 2024–2026 Artem Masharipov. All rights reserved. See [LICENSE](LICENSE).
