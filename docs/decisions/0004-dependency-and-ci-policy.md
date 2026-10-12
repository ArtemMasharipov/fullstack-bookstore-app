# 0004. Dependency and CI policy

- Status: accepted
- Date: 2026-10-10

## Context

The project had no CI, and `npm run lint` ran ESLint with `--fix`, so a check changed the files it checked. The
project then added development tools (Vitest, Supertest, mongodb-memory-server, happy-dom, Playwright) and a CI
workflow. Every new package and every CI action is third-party code that runs on developer machines and in CI, and a
release can turn out to be compromised soon after it is published.

## Decision

Dependencies:

- New dependencies get exact versions (`npm install --save-exact`).
- Every newly resolved package, direct or transitive, must have been published at least 14 days before it is
  installed. The install applies npm's cutoff: `npm install --before=<date 14 days ago>`.
- Dependencies that predate this policy keep their version ranges; the lock files decide what gets installed.
- Both lock files are committed, and CI installs with `npm ci`, which fails when a lock file does not match its
  `package.json`.

CI (`.github/workflows/ci.yml`):

- Every action is pinned to a full commit SHA, with the version in a comment: `actions/checkout@<sha> # v7.0.1`.
- `permissions: contents: read` limits the workflow token to reading the repository.
- `actions/checkout` runs with `persist-credentials: false`, so the token is not left in the git configuration of the
  checkout.
- Job timeouts: 15 minutes for `backend` and `frontend`, 25 minutes for `e2e`.
- CI scripts only check. `npm run lint` and `npm run format:check` never change files; `lint:fix` and `format` are
  separate scripts that change files and are run on purpose.

## Consequences

- Adding a package takes a cutoff date and sometimes means a version older than the latest. A fix published less than
  14 days ago waits for the cutoff too.
- Updating an action means looking up the commit of its new release; the version comment keeps the file readable.
- A lock file that is out of date with its `package.json` fails CI instead of being resolved again there.
- A formatting or lint problem fails CI; it is fixed locally with `lint:fix` or `format`.

## Defects caught in review

Every task had an independent review, and the finished branch had a final review. These defects were found before
the work was complete and fixed in the same branch:

- **Guard URI parsing.** The local-only database guard ended the credentials of a MongoDB URI at the last `@`, while
  the driver ends them at the first one. `mongodb://u:p@remote.example.com?authSource=admin@localhost` passed the
  guard but would have connected to `remote.example.com`. The guard now parses like the driver, and tests cover such
  URIs.
- **Young transitive packages.** The first lock file for the test tools applied the 14-day rule to the direct
  dependencies only and pulled in transitive packages published days earlier. It was resolved again with
  `npm install --before`, and the rule now covers every newly resolved package.
- **`VITE_API_URL` in the end-to-end build.** The build inherited `VITE_API_URL` from the shell or `frontend/.env*`.
  With an absolute URL there, the test browser called that API directly instead of the test API behind the preview's
  proxy, and the smoke test still passed. The build now sets `VITE_API_URL=/api/v1`, and the smoke test checks where
  the catalogue response came from.
- **An import that lint called unused.** ESLint reported the `ErrorMessage` import in `AuthorForm.vue` as unused, and
  it was removed. The template used the component through the kebab-case tag `<error-message>`; without the import,
  Vue resolved that tag to the component's own `errorMessage` string ref, which broke the error banner. The import is
  back, and the tag is written as `<ErrorMessage>`, which ESLint recognizes.
- **`SEED_ALLOW_REMOTE` in `.env`.** The seed command read the flag after loading `backend/.env`, so a `true` saved
  there would have turned every later `npm run seed` into seeding the remote database named in the same file. The
  flag is now read from the process environment only, and a test covers a `.env` that sets it.
- **Seed reset on a remote connection.** `seed({ reset: true })` deletes every user, author and book, and only the
  command-line wrapper checked that the database was local. `seed()` itself now refuses a non-local connection before
  it deletes anything. This one was caught during implementation, before the review.
