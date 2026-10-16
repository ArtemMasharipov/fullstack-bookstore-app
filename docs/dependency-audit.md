# Dependency audit

On 2026-10-16 `npm audit --omit=dev` found no vulnerabilities in the production dependencies of either package. The
development tools still have a few, listed under [Exceptions](#exceptions-development-only), each with a review date.

## Check

```bash
# in backend/ and in frontend/
npm audit --omit=dev --audit-level=high   # exits 0: no high or critical finding in production dependencies
npm audit                                 # also lists the development exceptions below
```

## Rule

- Production dependencies have no high or critical finding in `npm audit --omit=dev`.
- A finding is fixed within the major version. A direct dependency gets the fixed version as the floor of its range
  (`"express": "^4.22.3"`); a transitive one is updated inside its parent's range (`npm update <name>`).
  `npm audit fix --force` is not used: it changes major versions without review.
- Every newly resolved package was published at least 14 days earlier: installs run with
  `--before=<date 14 days ago>` ([decision 0004](decisions/0004-dependency-and-ci-policy.md)).
- A finding that cannot be fixed this way is listed below with the reason and a review date. On that date the audit
  runs again, and the entry is fixed, kept with a new date and reason, or removed.

## bcrypt 6

bcrypt is the one dependency updated across a major version, from 5.1.1 to 6.0.0:

- bcrypt 5 downloaded its native binary during installation with `@mapbox/node-pre-gyp`, which depends on `tar` 6.
  Every `tar` 6 release has known vulnerabilities, one of them critical. bcrypt 5.1.1 and node-pre-gyp 1.0.11 are the
  last releases of their major versions, so no update within them removes `tar`.
- bcrypt 6 ships prebuilt binaries inside the package. Installing it downloads nothing and pulls in neither
  node-pre-gyp nor `tar`.
- Its other breaking change is Node.js 18 or newer; this project runs on Node.js 24. The API (`genSalt`, `hash`,
  `compare`) and the hash format (`$2b$`) are unchanged, and a test signs in with a password hashed by bcrypt 5.

## Exceptions (development only)

These packages are installed by `npm ci` for development and tests. They are not part of the API process or the
build in `dist/`. All three are reviewed by **2027-01-15**.

### `braces` 3.0.3 — high

- Advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), a stack overflow on deeply
  nested brace patterns.
- Path: backend, `nodemon` → `chokidar` 3 → `braces`.
- Why it does not reach users: nodemon runs only with `npm run dev`, and the patterns come from its watch settings in
  this repository.
- Why there is no fix: `braces` has no patched release. `chokidar` 4 no longer uses it, but nodemon 3 requires
  `chokidar` 3.

### `sprintf-js` 1.0.3 — moderate

- Advisory: [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c), an exception on unbounded
  precision in a format string.
- Path: frontend, `eslint` 7 → `@eslint/eslintrc` → `js-yaml` 3 → `argparse` 1 → `sprintf-js`.
- Why it does not reach users: only ESLint uses it, while it reads this repository's configuration; the attack needs
  control of a format string.
- Why there is no fix: `sprintf-js` has no patched release. ESLint 9 uses `js-yaml` 4 and `argparse` 2, which do not
  depend on it.

### `postcss-selector-parser` 6.1.4 — moderate

- Advisory: [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf), quadratic parsing time for long
  flat selectors.
- Path: frontend, `eslint-plugin-vue` 8 → `postcss-selector-parser`.
- Why it does not reach users: only ESLint parses selectors, from this repository's components; the attack needs
  untrusted selectors parsed while serving requests.
- Why there is no fix: the fix is in 7.1.6, a major version that `eslint-plugin-vue` 8 does not accept. `npm audit fix`
  offers a downgrade of `eslint-plugin-vue` to 8.6.0 instead, which is not taken.

`npm audit` also flags the packages that depend on these three: `chokidar`, `nodemon`, `argparse`, `js-yaml`,
`@eslint/eslintrc`, `eslint` and `eslint-plugin-vue`.
