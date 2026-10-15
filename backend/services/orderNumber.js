/**
 * Order numbers: ORD-YYYYMMDD-NNNNNN, one sequence per UTC day.
 *
 * The sequence is a counter document incremented atomically, so orders placed
 * at the same moment never share a number. A number is taken before the order
 * is stored; if storing fails, that number is skipped, and gaps are expected.
 */

import Counter from "../models/Counter.js";

export async function nextOrderNumber(now = new Date()) {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  const increment = () =>
    Counter.findOneAndUpdate(
      { _id: `order:${day}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    ).lean();

  let counter;
  try {
    counter = await increment();
  } catch (error) {
    // The first two orders of a day race to create the counter; the loser
    // increments the counter the winner created
    if (error.code !== 11000) throw error;
    counter = await increment();
  }

  return `ORD-${day}-${String(counter.seq).padStart(6, "0")}`;
}
