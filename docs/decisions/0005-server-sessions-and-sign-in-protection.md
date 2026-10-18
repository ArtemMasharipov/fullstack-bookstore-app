# 0005. Server sessions behind the token, and protection of sign-in

- Status: accepted
- Date: 2026-10-18

## Context

The API signed a JWT with the user's id, username, email and role, valid for seven days, and `protect` trusted that
payload without asking the database:

- signing out did nothing on the server, so a copied token kept working;
- a deactivated user, or an admin whose role was taken away, kept their access until the token expired;
- the configured audience and issuer were read but neither signed nor checked.

Sign-in had no limit on failed attempts, and for an unknown or a deactivated account it answered without checking the
password, about ten times faster than for an existing one: the time told whether an email was registered.

## Decision

- **The token names a session.** It carries only the user id (`sub`) and a random session id (`jti`), and is signed
  with HS256 for `JWT_AUDIENCE` and `JWT_ISSUER` (defaults `bookstore-web` and `bookstore-api`). Each sign-in stores
  a session (`models/Session.js`) that expires with the token; a TTL index removes expired ones.
- **Every protected request checks the session and the user** (`services/sessions.js`, `middleware/auth.js`): the
  signature, the algorithm, the audience and the issuer, then the session by its id and the user by theirs. The role
  and the active flag come from the database, never from the token. That costs two indexed reads per protected
  request, read in parallel.
- **Ending a session ends its token.** Signing out deletes that session. Deactivating a user or changing their role
  deletes all of their sessions. Changing the password deletes them too and starts a new one for the device that made
  the change, so its user stays signed in.
- **Admins keep their access and the shop keeps an admin.** An admin cannot take away their own admin role or
  deactivate their own account (409 `ADMIN_SELF_CHANGE`). The acting admin is an active admin, so the shop can lose
  its last one only when two admins take each other's access at the same moment: the count of active admins is
  checked after the write, and a write that left none is undone (409 `LAST_ADMIN`).
- **Failed attempts are limited per client** (`middleware/rateLimit.js`, express-rate-limit): past
  `AUTH_RATE_LIMIT_MAX` failed requests to `/api/v1/auth` in `AUTH_RATE_LIMIT_WINDOW_MINUTES` (10 in 15 by default)
  the answer is 429 `RATE_LIMITED` with `Retry-After`. Only answers with status 400 and up count, so signing in and the
  normal use of `/auth` never reach the limit, while guessing passwords, probing taken emails and guessing the current
  password do. Signing out and `GET /auth/me` need a live session, guess nothing and are never limited, so a blocked
  address can still end its sessions. The client is the request's IP address; `TRUST_PROXY` says how many reverse
  proxies' `X-Forwarded-For` to trust (none by default, so the header cannot be used to dodge the limit).
- **Sign-in takes the same time for every account** (`utils/passwords.js`): the password is checked in every case,
  against a dummy hash of the same cost when there is no account, and a deactivated account is refused after the
  check, with the same answer.

## Consequences

- Signing out, deactivation and role changes act at once, on every device of the user.
- Tokens issued before this change have no session: every user signs in again once.
- The counts of failed attempts live in the API process. A restart forgets them, and several processes would count
  apart; a shared store would be needed to run more than one.
- Behind a reverse proxy `TRUST_PROXY` has to be set, or every client shares the proxy's address and one limit.
- Left for later: the token stays in the browser's `localStorage` as a Bearer token (an httpOnly cookie with CSRF
  protection is a separate decision before a public launch), and `jsonwebtoken` is to be replaced by `jose`.
- Integration tests pin each case: a token refused after each of the four events, with another audience, issuer or
  algorithm, without a session; the 429 on the eleventh failure; the sign-in times; the two admins changing each
  other at once.
