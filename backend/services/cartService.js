/**
 * Cart Service Layer
 *
 * A cart is a list of { bookId, quantity } entries. Every answer is a cart
 * view built from the books as they are now: their title, author, current
 * price in geller and whether they can still be bought, plus the quote.
 */

import mongoose from "mongoose";
import { config } from "../config/index.js";
import Book from "../models/Book.js";
import Cart from "../models/Cart.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { buildQuote, toMinorUnits } from "./pricing.js";

const MAX_QUANTITY = 99;

/**
 * Joins entries of the same book, in the order each book first appears; a
 * joined quantity stops at 99.
 */
export function combineEntries(items) {
  const quantities = new Map();
  for (const { bookId, quantity } of items) {
    quantities.set(
      bookId,
      Math.min(MAX_QUANTITY, (quantities.get(bookId) ?? 0) + quantity)
    );
  }
  return [...quantities].map(([bookId, quantity]) => ({ bookId, quantity }));
}

// lean() skips the schema default, so a book stored without the flag is in stock
const inStock = (book) => book.inStock !== false;

function lineFor({ bookId, quantity }, book) {
  if (!book) {
    return {
      bookId,
      title: null,
      authorName: null,
      image: null,
      unitPrice: 0,
      quantity,
      lineTotal: 0,
      available: false,
      unavailableReason: "DELETED",
    };
  }

  const unitPrice = toMinorUnits(book.price);
  const available = inStock(book);
  const authorName = book.author
    ? [book.author.firstName, book.author.lastName].filter(Boolean).join(" ")
    : "";

  return {
    bookId,
    title: book.title,
    authorName: authorName || null,
    image: book.image ?? null,
    unitPrice,
    quantity,
    lineTotal: unitPrice * quantity,
    available,
    unavailableReason: available ? null : "OUT_OF_STOCK",
  };
}

/**
 * The cart view of the given entries, with one query for all their books
 */
export async function buildCartView(entries) {
  const books = await Book.find({ _id: { $in: entries.map((e) => e.bookId) } })
    .populate("author", "firstName lastName")
    .lean();
  const byId = new Map(books.map((book) => [book._id.toString(), book]));

  const items = entries.map((entry) => lineFor(entry, byId.get(entry.bookId)));
  return { items, quote: buildQuote(items, config.commerce) };
}

async function readEntries(userId) {
  const cart = await Cart.findOne({ user: userId }).lean();
  return (cart?.items ?? []).map((item) => ({
    bookId: item.book.toString(),
    quantity: item.quantity,
  }));
}

// Every change is an atomic update of one line, so changes made at the same
// moment (two tabs, a merge during an addition, an order emptying the cart)
// never undo each other. A cart saved by the previous version kept prices and
// totals; each write drops them (strict: false, or Mongoose would leave fields
// out of the schema untouched).
const DROP_OLD_FIELDS = { $unset: { totalItems: 1, totalPrice: 1 } };

function updateCart(filter, update) {
  return Cart.updateOne(filter, { ...update, ...DROP_OLD_FIELDS }, { strict: false });
}

async function ensureCart(user) {
  const create = () =>
    Cart.updateOne({ user }, { $setOnInsert: { items: [] } }, { upsert: true });
  try {
    await create();
  } catch (error) {
    // Two first writes of one user race on the unique index; the loser finds
    // the cart the winner created
    if (error.code !== 11000) throw error;
    await create();
  }
}

/**
 * Adds copies of a book to the cart. A line that would pass 99 copies is
 * refused ("overflow") or, with overflow "cap", set to 99.
 */
async function putLine(user, book, quantity, { overflow }) {
  for (let round = 0; round < 2; round += 1) {
    const added = await updateCart(
      { user, items: { $elemMatch: { book, quantity: { $lte: MAX_QUANTITY - quantity } } } },
      { $inc: { "items.$.quantity": quantity } }
    );
    if (added.matchedCount) return "merged";

    if (overflow === "cap") {
      const capped = await updateCart(
        { user, items: { $elemMatch: { book, quantity: { $gt: MAX_QUANTITY - quantity } } } },
        { $set: { "items.$.quantity": MAX_QUANTITY } }
      );
      if (capped.matchedCount) return "merged";
    }

    const pushed = await updateCart(
      { user, "items.book": { $ne: book } },
      { $push: { items: { book, quantity } } }
    );
    if (pushed.matchedCount) return "added";
    // The book is in the cart now: either it was added at the same moment,
    // and the next round adds to it, or it is already over the limit
  }
  return "overflow";
}

const objectId = (id) => new mongoose.Types.ObjectId(id);
const notInCart = () => new NotFoundError("Book is not in the cart", "CART_ITEM_NOT_FOUND");

export async function getCartView(userId) {
  return buildCartView(await readEntries(userId));
}

export async function addItem(userId, { bookId, quantity }) {
  const book = await Book.findById(bookId).lean();
  if (!book) throw new NotFoundError("Book not found");
  if (!inStock(book)) throw new ConflictError("Book is out of stock", "BOOK_UNAVAILABLE");

  await ensureCart(userId);
  const result = await putLine(userId, objectId(bookId), quantity, { overflow: "reject" });
  if (result === "overflow") {
    throw new ValidationError("A cart holds at most 99 copies of a book", {
      quantity: "too_big",
    });
  }
  return getCartView(userId);
}

export async function setItemQuantity(userId, bookId, quantity) {
  const book = objectId(bookId);
  // The whole line is replaced, so a line saved by the previous version loses
  // its stored price
  const result = await updateCart(
    { user: userId, "items.book": book },
    { $set: { "items.$": { book, quantity } } }
  );
  if (!result.matchedCount) throw notInCart();
  return getCartView(userId);
}

export async function removeItem(userId, bookId) {
  const book = objectId(bookId);
  const result = await updateCart(
    { user: userId, "items.book": book },
    { $pull: { items: { book } } }
  );
  if (!result.matchedCount) throw notInCart();
  return getCartView(userId);
}

export async function clearCart(userId) {
  // No cart yet means it is already empty
  await updateCart({ user: userId }, { $set: { items: [] } });
  return getCartView(userId);
}

/**
 * The view of a guest cart; nothing is stored
 */
export async function quoteItems(items) {
  return buildCartView(combineEntries(items));
}

/**
 * Adds a guest cart to the user's cart after sign-in. Quantities of a book
 * already there are added up to 99; books that can no longer be bought are
 * not stored and come back in report.skipped with the reason.
 */
export async function mergeItems(userId, items) {
  const incoming = await buildCartView(combineEntries(items));
  const report = { added: [], merged: [], skipped: [] };

  for (const line of incoming.items) {
    if (!line.available) {
      report.skipped.push({ bookId: line.bookId, reason: line.unavailableReason });
      continue;
    }
    await ensureCart(userId);
    const result = await putLine(userId, objectId(line.bookId), line.quantity, {
      overflow: "cap",
    });
    report[result === "added" ? "added" : "merged"].push(line.bookId);
  }

  return { cart: await getCartView(userId), report };
}
