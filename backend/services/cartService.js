/**
 * Cart Service Layer
 *
 * A cart is a list of { bookId, quantity } entries. Every answer is a cart
 * view built from the books as they are now: their title, author, current
 * price in geller and whether they can still be bought, plus the quote.
 */

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
    available: book.inStock,
    unavailableReason: book.inStock ? null : "OUT_OF_STOCK",
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

/**
 * Stores the entries and answers their view. A cart saved by the previous
 * version kept prices and totals; the write drops them (strict: false, or
 * Mongoose would leave fields out of the schema untouched).
 */
async function writeEntries(userId, entries) {
  const update = () =>
    Cart.findOneAndUpdate(
      { user: userId },
      {
        $set: { items: entries.map(({ bookId, quantity }) => ({ book: bookId, quantity })) },
        $unset: { totalItems: 1, totalPrice: 1 },
      },
      { upsert: true, new: true, strict: false }
    );

  try {
    await update();
  } catch (error) {
    // Two first writes of one user race on the unique index; the loser
    // updates the cart the winner created
    if (error.code !== 11000) throw error;
    await update();
  }

  return buildCartView(entries);
}

function entryOf(entries, bookId) {
  const entry = entries.find((e) => e.bookId === bookId);
  if (!entry) throw new NotFoundError("Book is not in the cart", "CART_ITEM_NOT_FOUND");
  return entry;
}

export async function getCartView(userId) {
  return buildCartView(await readEntries(userId));
}

export async function addItem(userId, { bookId, quantity }) {
  const book = await Book.findById(bookId).lean();
  if (!book) throw new NotFoundError("Book not found");
  if (!book.inStock) throw new ConflictError("Book is out of stock", "BOOK_UNAVAILABLE");

  const entries = await readEntries(userId);
  const existing = entries.find((e) => e.bookId === bookId);
  const total = (existing?.quantity ?? 0) + quantity;
  if (total > MAX_QUANTITY) {
    throw new ValidationError("A cart holds at most 99 copies of a book", {
      quantity: "too_big",
    });
  }

  if (existing) existing.quantity = total;
  else entries.push({ bookId, quantity });
  return writeEntries(userId, entries);
}

export async function setItemQuantity(userId, bookId, quantity) {
  const entries = await readEntries(userId);
  entryOf(entries, bookId).quantity = quantity;
  return writeEntries(userId, entries);
}

export async function removeItem(userId, bookId) {
  const entries = await readEntries(userId);
  entryOf(entries, bookId);
  return writeEntries(
    userId,
    entries.filter((e) => e.bookId !== bookId)
  );
}

export async function clearCart(userId) {
  return writeEntries(userId, []);
}

/**
 * The view of a guest cart; nothing is stored
 */
export async function quoteItems(items) {
  return buildCartView(combineEntries(items));
}
