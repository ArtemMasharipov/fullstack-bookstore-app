# Book prices in whole geller

Status: accepted, 2026-11-01.

## Context

Orders, quotes and carts count money in whole geller (1/100 CZK), but book prices are still stored in crowns as
floats. `services/pricing.js` converts each price once, and a stored value such as `249.89999999999998` only reads
as 24990 geller because the conversion rounds at 12 significant digits. Storing the prices in whole geller removes
that conversion, but every reader of `price` has to change with it: an application that read geller as crowns would
charge a hundred times the price.

## Decision

Migrate in two steps, expand and then contract.

- **Expand.** `npm run migrate:book-prices -- up` adds `priceMinor`, the price in whole geller, next to `price`, which
  stays as it is. The release before the switch keeps reading `price`, so it works the same before, during and after
  the migration. `down` removes `priceMinor` again; the migration never changes `price`.
- **Switch reads and writes.** The application reads integer `priceMinor`, falling back to `price` only for legacy
  books without it. Book writes and seeding store both fields together. API views return `priceMinor` and `currency`
  alongside legacy `price` for one release; the frontend displays and submits the minor amount. The admin form
  accepts crowns with up to two decimal places and converts the text to geller. Sorting keeps the crowns field and
  its index for now, so books written by the previous release still sort correctly.
- **Contract, later.** Remove the legacy field, its API compatibility and the fallback only after the switch has
  proved itself; move the sort and its index to `priceMinor` in that change.
- `preflight`, also run by `up`, refuses prices that are not whole geller: not a finite number, negative, above
  999999.99, or more precise than a geller. Nothing is written then. A marker in the `migrations` collection records
  that every book had its `priceMinor` after `up`.
- `up` writes a backup of all books first (canonical Extended JSON in `backend/backups/`, ignored by git, with the
  numeric types of the documents kept). `restore <file>` backs the current books up as well, then replaces them
  with the file's in one transaction, and refuses a database that is not local even when called from code.
- The command accepts only a local database, checked like the seed command: the URI before connecting and the
  connection after.

## Consequences

- `up` and `down` can run again at any time. A book added or repriced between `up` and the switch gets its
  `priceMinor` on the next `up`; a book whose price changes while `up` runs is left out, reported and covered by the
  next run.
- Before the switch, `priceMinor` is an unread copy. Stop the previous release's writers and run `up` once more
  before starting canonical reads. The same applies after a rollback: the older release can change `price` without
  refreshing an existing `priceMinor`, so rerun `up` before switching forward. Old and new writers cannot run together.
- Orders are not migrated: current orders already store geller, and older orders are converted when they are read
  (`services/orderView.js`).
- Remote databases are out of reach of this command by design. Migrating real data elsewhere needs its own backup,
  check and approval.
