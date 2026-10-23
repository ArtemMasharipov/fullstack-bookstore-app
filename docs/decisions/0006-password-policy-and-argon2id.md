# Password policy and Argon2id

Status: accepted, 2026-10-23.

New passwords share one backend policy at registration, password change, admin creation and seed: NFKC,
15–128 Unicode code points, without composition rules or trimming. Reject exact common-password matches
and case-insensitive substrings of username, email local part or Bookstore. The local blocklist records its
pinned SecLists source, source hash and selection rule in metadata, with the full MIT notice beside it.
No runtime network service is involved. The client checks normalized length; the server remains authoritative.

Use asynchronous native Node Argon2id, requiring Node 24.7+ within 24.x. PHC v19 hashes use 19,456 KiB,
two passes, one lane, a random 16-byte salt and a 32-byte tag. The parser accepts only supported bounded
parameters and canonical salt/tag lengths. Argon2id avoids bcrypt's 72-byte truncation without a bcrypt pre-hash.

Legacy $2a$/$2b$ bcrypt verifies raw input. Successful sign-in upgrades it with a credential/version conditional
update, without saving an old user document or resetting its version. Argon2id checks NFKC input. Keep bcrypt
until legacy hashes are gone. Each login performs one real-or-dummy Argon2id check and one real-or-dummy bcrypt
check in the same order, including unknown or inactive accounts.

Password changes and full session revocation reserve the existing user version, shared with role/status writes.
Only the reservation owner commits it. Password success ends all old sessions and returns one replacement token
after commit; logout-all returns 204 with none. Login and registration verify their snapshot after session
insertion and discard their own late session after concurrent revocation. Two competing password changes cannot
both succeed, and an old credential snapshot never overwrites profile fields.

This is a multi-document protocol without transactions. A process/database interruption may leave a negative
version and intermediate credential state requiring operator recovery. Do not blindly restore old credentials
or sessions, and do not steal a reservation based on elapsed time.

The profile edits first name, last name and username, with email as text. The auth store binds requests to the
captured token and ignores stale responses after a session change. Rotation updates storage and state before
its single success notification without repeating cart merging. Both locales have linked errors, focused
summaries and keyboard reveal buttons.

References: [Node crypto](https://nodejs.org/download/release/v24.21.0/docs/api/crypto.html#cryptoargon2algorithm-parameters-callback),
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#argon2id),
[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html#passwordver).
NFKC is this project's explicit compatibility choice; NIST recommends NFC.
