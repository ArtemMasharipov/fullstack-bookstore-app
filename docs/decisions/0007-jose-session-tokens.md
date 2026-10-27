# jose session tokens

Status: accepted, 2026-10-27.

Use exact `jose 6.2.12` for HS256 signing and verification. Remove `jsonwebtoken` and `jws` from the backend
graph, including test-only consumers. Tests create and verify legacy-format HMAC fixtures independently through
`node:crypto`. Keep the frontend's `jwt-decode`: decoding the client token is a different responsibility.

The server-session protocol in decision 0005 and the credential/access reservation protocol in decision 0006
remain authoritative. New tokens have the same `sub`, `jti`, `aud`, `iss`, `iat`, `exp` claims and JWT/HS256 header.
Use the secret's UTF-8 bytes, not base64 decoding. Recognizable asymmetric key material cannot be used as an HMAC
secret. Matching valid previously issued tokens keep working with their live session and user; no forced login
is required by this library change.

Verification allows only HS256 and the configured audience/issuer, with zero clock tolerance. Keep exp/iat
optional for reading, aud-array matching and the current subject/session-id checks. The new JOSE verifier also
rejects malformed present iat and unsupported critical headers; the old server did not issue those tokens.
Role and active state still come from the database. Only crypto/claims failures become the generic401; DB
failures propagate and pending account revisions retain 409.

Keep exact `ms 2.1.3` as a direct dependency to own the existing expiration language. A string means milliseconds,
an integer number means seconds; compute numeric exp explicitly with the old floor operation. For example,
`JWT_EXPIRATION=1000` means one second, `1.5s` means one second, and negative durations remain expired rather than
silently taking the default. Invalid durations fail at issuance before the session insert, not at startup.
Session.expiresAt is exactly exp multiplied by 1000.

Signing is asynchronous. Await it before inserting a session and retain the exact credential/access postcheck
after insertion. A stale operation removes only its own jti. Password replacement still reserves a negative
revision, revokes sessions, signs, commits and postchecks. A signing failure leaves no replacement session and
does not restore old credentials or clear an interrupted reservation; operator recovery remains separate work.

This supersedes decision 0001's current explanation of the SlowBuffer dependency. That historical record is
retained. Support remains Node 24, with 24.21.0 pinned for verification; removing one compatibility blocker does
not validate bcrypt/Argon2id/MongoDB/bundlers or the full application on another major. Node 26 compatibility,
support metadata and CI coverage require their own decision and verification. Engines and the CI matrix do
not change here.

Bearer transport, token storage, cookies/CSRF, key rotation and registration disclosure are separate decisions.
This migration does not close the dated dependency exceptions in [the audit](../dependency-audit.md).

References: [decision 0005](0005-server-sessions-and-sign-in-protection.md),
[decision 0006](0006-password-policy-and-argon2id.md),
[jose pinned claims handling](https://github.com/panva/jose/blob/v6.2.12/src/lib/jwt_claims_set.ts),
[ms 2.1.3](https://github.com/vercel/ms/tree/2.1.3).
