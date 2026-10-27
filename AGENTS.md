# AGENTS.md

Rules for coding agents and people working in this repository. The README has the full developer guide.

## Environment

- Node.js 24 (`.nvmrc` pins 24.21.0). Other major versions require separate compatibility verification and are not supported.
- Two npm packages with their own lock files: `backend/` and `frontend/`. Install each with `npm ci`.

## Commands

| Directory   | Command                                | What it does                                                            |
| ----------- | -------------------------------------- | ----------------------------------------------------------------------- |
| `backend/`  | `npm test`                             | Vitest: unit and integration tests on an in-memory MongoDB              |
| `frontend/` | `npm test`                             | Vitest unit tests (happy-dom)                                           |
| `frontend/` | `npm run lint`, `npm run format:check` | ESLint and Prettier, check only                                         |
| `frontend/` | `npm run build`                        | Production build into `dist/` at the repository root                    |
| `frontend/` | `npm run test:e2e`                     | Playwright smoke test with its own API on port 3100 and preview on 4173 |

## Rules

- Tests, the seed command and the e2e server use only a local or in-memory MongoDB. Never point them at a remote
  database, and never read or print `backend/.env`.
- The CI commands never rewrite source files. Use `npm run lint:fix` and `npm run format` on purpose only.
- Write the failing test first, then the code. Keep each change small and focused.
- Change `package.json`, lock files or `.github/workflows/` only when the task is about them. New dependencies get
  exact versions and must have been published at least 14 days ago.
- Commit messages follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `ci:`).
- Never commit secrets or `.env` files. `backend/.env.example` and `frontend/.env.example` list the variables.
