/**
 * Book Service Layer
 * Contains ALL business logic for books
 * No HTTP/request/response handling here!
 */

import mongoose from "mongoose";
import Author from "../models/Author.js";
import Book from "../models/Book.js";
import { IDENTITY_COLLATION } from "../models/collation.js";
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";
import { toBookView } from "./bookView.js";
import { toMinorUnits } from "./pricing.js";
import { sortOf } from "../utils/listSort.js";

/**
 * Get books with filtering and pagination
 * @param {Object} query - Parsed listBooksQuery (page, limit, category, authorId, inStock, search, sortBy)
 * @returns {Object} { books, pagination: { page, limit, total, pages } }
 */
export async function getBooks({ page, limit, category, authorId, inStock, search, sortBy }) {
  // Filters compare whole values: a category is chosen from a list, not searched for
  const filter = {};
  if (category) filter.category = category;
  if (authorId) filter.author = authorId;
  if (inStock !== undefined) filter.inStock = inStock;

  // Search matches part of the title or description, as plain text
  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: searchRegex }, { description: searchRegex }];
  }

  const [books, total] = await Promise.all([
    Book.find(filter)
      .populate("author", "firstName lastName")
      .sort(sortOf(sortBy))
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Book.countDocuments(filter),
  ]);

  return {
    books: books.map(toBookView),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get book by ID
 * @param {string} id - Book ID
 * @returns {Object} Book view
 */
export async function getBookById(id) {
  const book = await Book.findById(id)
    .populate("author", "firstName lastName bio")
    .lean();

  if (!book) {
    throw new NotFoundError("Book not found");
  }

  return toBookView(book);
}

// The optional fields of a book: PUT removes the ones its body leaves out
const OPTIONAL_FIELDS = ["description", "image"];

// The fields to store from a parsed bookBody: authorId is stored as the author
// reference, and the price in geller together with its crowns, which the
// previous release reads
function storedFields({ authorId, price, priceMinor, ...fields }) {
  const minor = priceMinor ?? toMinorUnits(price);
  return { ...fields, author: authorId, priceMinor: minor, price: minor / 100 };
}

// The first write of every transaction that writes a book: it raises the
// author's bookRevision, so it conflicts with a delete of that author running
// at the same moment, and the driver runs the losing transaction again
// (connection.transaction uses session.withTransaction) on what the winner
// wrote. It also checks that the author exists. Anything but one matched
// author stops the write, also an update Mongoose did not send at all. The
// author's updatedAt stays as it was: a new book is no change of its author
async function touchAuthor(authorId, session) {
  const { matchedCount } = await Author.updateOne(
    { _id: authorId },
    { $inc: { bookRevision: 1 } },
    { session, timestamps: false }
  );
  if (matchedCount !== 1) {
    throw new ValidationError("Validation failed", { authorId: "not_found" });
  }
}

const duplicateBook = () =>
  new AppError("A book with this title, author and year already exists", 409, "CONFLICT", {
    fields: { title: "duplicate" },
  });

// The same title, author and year is the same book, the title compared as
// IDENTITY_COLLATION does; exceptId is the book being replaced
async function assertNotDuplicate({ title, authorId, publicationYear }, exceptId, session) {
  const filter = { title, author: authorId, publicationYear };
  if (exceptId) filter._id = { $ne: exceptId };
  if (await Book.exists(filter, { session, collation: IDENTITY_COLLATION })) {
    throw duplicateBook();
  }
}

// A duplicate written by another writer after the check is refused by the
// unique index. It gets the same answer: the generic one would name author
async function writeBook(write) {
  try {
    return await write();
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.title) throw duplicateBook();
    throw error;
  }
}

const withAuthor = (query) => query.populate("author", "firstName lastName").lean();

/**
 * Create a book
 * @param {Object} body - Parsed bookBody
 * @returns {Object} Book view
 */
export async function createBook(body) {
  const book = await writeBook(() =>
    mongoose.connection.transaction(async (session) => {
      await touchAuthor(body.authorId, session);
      await assertNotDuplicate(body, undefined, session);
      const [created] = await Book.create([storedFields(body)], { session });
      return created;
    })
  );

  return toBookView(await withAuthor(Book.findById(book._id)));
}

/**
 * Replace a book: the fields of the body, and no optional field it leaves out
 * @param {string} id - Book ID
 * @param {Object} body - Parsed bookBody
 * @returns {Object} Book view
 */
export async function updateBook(id, body) {
  if (!(await Book.exists({ _id: id }))) {
    throw new NotFoundError("Book not found");
  }

  const absent = OPTIONAL_FIELDS.filter((field) => body[field] === undefined);
  const update = {
    $set: storedFields(body),
    ...(absent.length && { $unset: Object.fromEntries(absent.map((field) => [field, ""])) }),
  };
  // Touches the author the book has after the write. Its previous author needs
  // no touch: a delete of that author meanwhile still counts the book, and is refused
  const book = await writeBook(() =>
    mongoose.connection.transaction(async (session) => {
      await touchAuthor(body.authorId, session);
      await assertNotDuplicate(body, id, session);
      const updated = await withAuthor(
        Book.findByIdAndUpdate(id, update, { new: true, runValidators: true, session })
      );
      // Deleted between the check and the write
      if (!updated) throw new NotFoundError("Book not found");
      return updated;
    })
  );

  return toBookView(book);
}

/**
 * Delete a book
 * @param {string} id - Book ID
 */
export async function deleteBook(id) {
  if (!(await Book.findByIdAndDelete(id))) {
    throw new NotFoundError("Book not found");
  }
}

/**
 * Get books in stock of exactly one category
 * @param {string} category - Category name
 * @param {Object} options - Parsed categoryBooksQuery (limit, sortBy)
 * @returns {Array} Book views
 */
export async function getBooksByCategory(category, { limit, sortBy }) {
  const books = await Book.find({ category, inStock: true })
    .populate("author", "firstName lastName")
    .sort(sortOf(sortBy))
    .limit(limit)
    .lean();

  return books.map(toBookView);
}

/**
 * Set whether a book is in stock
 * @param {string} id - Book ID
 * @param {boolean} inStock - Stock status
 * @returns {Object} Book view
 */
export async function updateBookStock(id, inStock) {
  const book = await withAuthor(
    Book.findByIdAndUpdate(id, { $set: { inStock } }, { new: true, runValidators: true })
  );

  if (!book) {
    throw new NotFoundError("Book not found");
  }

  return toBookView(book);
}

/**
 * Get books by author
 * @param {string} authorId - Author ID
 * @param {Object} options - Parsed authorBooksQuery (limit, sortBy)
 * @returns {Array} Book views
 */
export async function getBooksByAuthor(authorId, { limit, sortBy }) {
  // Verify author exists
  const author = await Author.findById(authorId);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  const books = await Book.find({ author: authorId })
    .populate("author", "firstName lastName")
    .sort(sortOf(sortBy))
    .limit(limit)
    .lean();

  return books.map(toBookView);
}
