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
  stays as it is. The running application keeps reading `price`, so it works the same before, during and after the
  migration, and so does the previous release. `down` removes `priceMinor` again; `price` was never changed.
- **Contract, later.** The application switches its reads and writes to `priceMinor` in its own change, and only
  after that release proves itself is `price` removed.
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
- Until the switch, `priceMinor` is a copy that nothing reads. The switch must run `up` once more before it starts
  reading it.
- Orders are not migrated: current orders already store geller, and older orders are converted when they are read
  (`services/orderView.js`).
- Remote databases are out of reach of this command by design. Migrating real data elsewhere needs its own backup,
  check and approval.
