# Catalogue identities

Status: accepted, 2026-11-18.

## Context

An author is identified by its first and last name. The service checked for an existing author with an exact
comparison and then wrote, and the index on the two names was not unique. So `KAREL ČAPEK`, or `Karel Čapek` with
its `Č` written as `C` plus a combining caron, was another author next to `Karel Čapek`, and two requests creating the
same author at the same moment both passed the check. Only a unique index keeps every writer (the API, the seed,
scripts) to one author per name.

The previous release declares a plain index on `{ firstName, lastName }`, automatically named
`firstName_1_lastName_1`. Declaring the same key with other options under that name makes MongoDB refuse to create it
(`IndexKeySpecsConflict`), and the server builds every declared index before it takes requests.

## Decision

- **One author per name, without regard to case.** A unique index `firstName_lastName_cs2_unique` on
  `{ firstName, lastName }` with the collation `{ locale: "cs", strength: 2 }`. Names that differ only in case are
  the same name, and so are names that differ only in how a character is written: `Č` as one character or as `C`
  plus a combining caron, a full-width letter, a ligature such as `ﬁ`, a no-break space for a space. Invisible
  characters such as the soft hyphen or the zero-width space do not count at all. Diacritics do count:
  `Karel Capek` is another author, and so is `Johann Strauss` next to `Johann Strauß`. So do punctuation and the
  number of inner spaces; names are trimmed before they are stored. The collation keeps MongoDB's default
  `normalization: false`, so two canonically equivalent names whose combining marks come in another order are two
  names. Czech and English names are not written that way, and the default stays. Czech is the shop's language; for
  equality `cs` and `en` agree.
- **One constant.** `IDENTITY_COLLATION` in `backend/models/collation.js` serves the index, the service's duplicate
  check and the preflight. A query that looks for a duplicate must pass it; without it MongoDB compares exactly.
- **The check stays as the fast path.** The service still looks for a duplicate before it writes, with the same
  collation, and answers 409 `CONFLICT` with `fields: { lastName: "duplicate" }`. A duplicate written in between is
  refused by the index, and the service answers it the same way; the generic duplicate-key answer would name
  `firstName`. An author may change the case of its own name.
- **A name of its own for the index.** It is built next to the previous release's `firstName_1_lastName_1`, which is
  no longer declared; an existing database keeps that index until someone drops it.
- **Fail closed on existing duplicates.** A unique index cannot be built over duplicates: no document changes, and
  the server does not start. Its message names `npm run check:identities` instead of the collation keys MongoDB
  reports. That command lists every name that collides, with the ids and the book count of each author, and changes
  nothing. Each collision is settled by hand, through the API: rename one author, or move its books to the other and
  delete it.

## Consequences

- Rollout: run `npm run check:identities` against the database; settle any collision and run it again; then start
  the new release. `db.authors.getIndexes()` then lists the unique index with `collation.locale: "cs"` and
  `strength: 2`. Dropping `firstName_1_lastName_1` is optional.
- The command accepts only a local database, as the migration command does, and the seed command by default. For
  another database, the same check runs in mongosh; `$ifNull` groups a missing field with `null`, as the unique index
  does:

  ```js
  db.authors.aggregate([
    { $group: { _id: { firstName: { $ifNull: ["$firstName", null] }, lastName: { $ifNull: ["$lastName", null] } },
                authors: { $push: { id: "$_id", firstName: "$firstName", lastName: "$lastName" } },
                count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { _id: 0, authors: 1 } }
  ], { collation: { locale: "cs", strength: 2 } })
  ```

- Rollback: the previous release starts with the new index in place, and builds `firstName_1_lastName_1` again if it
  was dropped. While the unique index exists, it answers a name that differs only in case with the generic 409 on
  `firstName` instead of creating the author. `db.authors.dropIndex("firstName_lastName_cs2_unique")` gives it back
  its own behavior; no document changes either way. The previous release may then create duplicates again, so a
  rollout after a rollback starts with the preflight.
