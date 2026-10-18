/**
 * Book Service Layer
 * Contains ALL business logic for books
 * No HTTP/request/response handling here!
 */

import Author from "../models/Author.js";
import Book from "../models/Book.js";
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";
import { toBookView } from "./bookView.js";

/**
 * The sort of a sortBy key ("price", "-price"). _id breaks ties in the same
 * direction: MongoDB does not keep equal values in a stable order, and
 * without it skip and limit could show a book on two pages and another on
 * none.
 * @param {string} sortBy - A key from BOOK_SORTS
 * @returns {Object} Mongoose sort
 */
export function sortOf(sortBy) {
  const direction = sortBy.startsWith("-") ? -1 : 1;
  return { [sortBy.replace(/^-/, "")]: direction, _id: direction };
}

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

// The fields to store from a parsed bookBody: authorId is stored as the author reference
function storedFields({ authorId, ...fields }) {
  return { ...fields, author: authorId };
}

async function assertAuthorExists(authorId) {
  if (!(await Author.exists({ _id: authorId }))) {
    throw new ValidationError("Validation failed", { authorId: "not_found" });
  }
}

// The same title, author and year is the same book; exceptId is the book being replaced
async function assertNotDuplicate({ title, authorId, publicationYear }, exceptId) {
  const filter = { title, author: authorId, publicationYear };
  if (exceptId) filter._id = { $ne: exceptId };
  if (await Book.exists(filter)) {
    throw new AppError("A book with this title, author and year already exists", 409, "CONFLICT", {
      fields: { title: "duplicate" },
    });
  }
}

const withAuthor = (query) => query.populate("author", "firstName lastName").lean();

/**
 * Create a book
 * @param {Object} body - Parsed bookBody
 * @returns {Object} Book view
 */
export async function createBook(body) {
  await assertAuthorExists(body.authorId);
  await assertNotDuplicate(body);

  const book = await Book.create(storedFields(body));

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
  await assertAuthorExists(body.authorId);
  await assertNotDuplicate(body, id);

  const absent = OPTIONAL_FIELDS.filter((field) => body[field] === undefined);
  const update = {
    $set: storedFields(body),
    ...(absent.length && { $unset: Object.fromEntries(absent.map((field) => [field, ""])) }),
  };
  const book = await withAuthor(Book.findByIdAndUpdate(id, update, { new: true, runValidators: true }));

  // Deleted between the check and the write
  if (!book) {
    throw new NotFoundError("Book not found");
  }

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
