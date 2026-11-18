/**
 * Race helper
 * Two requests race between the check of a write and the write itself.
 * meetingPoint() holds each of them at a seam, a model method, until the other
 * one has come to its own seam, has answered, or has to run its transaction
 * again because of the first one's uncommitted write. Only then do both go on,
 * so both have checked before either writes. No timer decides anything.
 *
 * The last case is the one a fixed service creates: it keeps the second request
 * behind the first one's transaction, so that request never comes to its seam,
 * and only the rerun of its transaction shows that it waits.
 */

import mongoose from "mongoose";
import { vi } from "vitest";

export function meetingPoint(parties = 2) {
  let arrived = 0;
  let open;
  const opened = new Promise((resolve) => {
    open = resolve;
  });
  const arrive = () => {
    arrived += 1;
    if (arrived >= parties) open();
    return opened;
  };

  // The query runs its own exec when hold lets it, and keeps its chain
  // (.lean(), .populate(), .session())
  const holdExec = (query, hold) => {
    const exec = query.exec.bind(query);
    query.exec = (...args) => hold(() => exec(...args));
    return query;
  };

  return {
    // Holds a call until the meeting opens. create writes as soon as it is
    // called, so it is held before the call; a query is held before it runs
    before(model, method) {
      const original = model[method];
      vi.spyOn(model, method).mockImplementation(function (...args) {
        if (method === "create") return arrive().then(() => original.apply(this, args));
        return holdExec(original.apply(this, args), (run) => arrive().then(run));
      });
    },

    // Runs a query and holds its answer until the meeting opens
    after(model, method) {
      const original = model[method];
      vi.spyOn(model, method).mockImplementation(function (...args) {
        return holdExec(original.apply(this, args), async (run) => {
          const result = await run();
          await arrive();
          return result;
        });
      });
    },

    // A request that has answered comes to no seam any more
    track(request) {
      return Promise.resolve(request).finally(arrive);
    },

    // A transaction that has to run again waits for the other request's write
    openOnRetry() {
      const { connection } = mongoose;
      const transaction = connection.transaction;
      vi.spyOn(connection, "transaction").mockImplementation(function (fn, options) {
        return transaction.call(
          this,
          async (session) => {
            try {
              return await fn(session);
            } catch (error) {
              if (error.hasErrorLabel?.("TransientTransactionError")) open();
              throw error;
            }
          },
          options
        );
      });
    },

    open: () => open(),
  };
}
