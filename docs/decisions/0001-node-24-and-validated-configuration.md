# 0001. Node.js 24 LTS and configuration validated at startup

- Status: accepted
- Date: 2026-10-10

## Context

The project did not pin a Node.js version, and the backend did not start on Node.js 25. `jsonwebtoken` 9.0.2 depends,
through `jws` and `jwa`, on `buffer-equal-constant-time` 1.0.1, which reads `buffer.SlowBuffer`. Node.js 25 removed
`SlowBuffer`, so importing `jsonwebtoken` failed with a `TypeError`. Node.js 25 also reached its end of life on
2026-06-01. On Node.js 24 the same code installed and ran without changes.

The backend configuration had unsafe or inconsistent defaults:

- `config/default.js` loaded `.env` when it was imported, so any script or test that touched the configuration picked
  up the database URI written there;
- without `JWT_SECRET`, tokens were signed with a hard-coded fallback secret;
- CORS allowed any origin by default;
- `NODE_ENV` defaulted to `development`, and in development an unexpected error sent its message and stack trace to
  the API client;
- the API listened on port 5000 by default, while the frontend expected it on 3000.

## Decision

Runtime:

- The project runs on Node.js 24 LTS. `.nvmrc` contains `24`, both `package.json` files declare
  `"engines": { "node": "24.x" }`, and CI reads the version from `.nvmrc`.
- Node.js 25 and newer are not supported: `jsonwebtoken` needs `SlowBuffer`.

Configuration:

- `config/default.js` exports `loadConfig(env)`, which reads only the object it is given. It collects every problem
  and throws one `ConfigError` that lists them all; otherwise it returns a frozen configuration. The module's default
  export is `loadConfig(process.env)`.
- `server.js` loads the configuration before it connects or listens. On a `ConfigError` it prints the list of
  problems and exits with code 1.
- Only entry points read `.env`. `config/load-env.js` loads it: `server.js` imports it first, and the seed command
  loads it before the configuration. It does nothing when `NODE_ENV=test`. `app.js`, the configuration module and
  the test setup never read the file.
- The rules, where an empty value counts as not set:
  - `JWT_SECRET` is required in every environment and must be at least 32 characters in production. There is no
    fallback secret, and `backend/.env.example` leaves the value empty: a long placeholder there would pass the
    production check with a secret that anyone can read.
  - In production `CORS_ORIGIN` is required and must not be `*`; elsewhere it defaults to `http://localhost:8080`.
  - `NODE_ENV` must be `development`, `test` or `production`, and `PORT` an integer from 0 to 65535 (default 3000).
    Production also needs `MONGODB_URI` or the older `MONGODB_URL`.
- An unexpected error is answered with `Internal server error` and no stack trace. Only `EXPOSE_ERROR_DETAILS=true`
  outside production adds the real message and the stack; production ignores the flag.

## Consequences

- Developers need Node.js 24; the README shows how to install it.
- A misconfigured backend does not start at all, and one run shows every problem at once. Deployment mistakes such as
  a short secret or `CORS_ORIGIN=*` stop the process instead of reaching users.
- After copying `backend/.env.example`, a developer has to generate a `JWT_SECRET` before the backend or the seed
  command will start.
- The configuration tests call `loadConfig()` with their own objects and do not depend on the machine's environment.
- Because only the entry points load `.env`, tests and the end-to-end server cannot pick up a database URI from it
  ([decision 0002](0002-test-infrastructure-and-local-database-guard.md)).
- Moving to a newer Node.js line means checking the JWT dependency chain first.
