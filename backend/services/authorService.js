/**
 * Author Service Layer
 * Contains ALL business logic for authors
 * No HTTP/request/response handling here!
 */

import Author from "../models/Author.js";
import Book from "../models/Book.js";
import { toAuthorView } from "./authorView.js";
import { toBookView } from "./bookView.js";
import { sortOf } from "../utils/listSort.js";
import {
  AppError,
  ConflictError,
  NotFoundError,
} from "../utils/errors.js";

/**
 * Get authors with filtering and pagination
 * @param {Object} filters - Parsed listAuthorsQuery (page, limit, country, search, sortBy)
 * @returns {Object} { authors, pagination }
 */
export async function getAuthors({ page, limit, country, search, sortBy }) {
  const query = {};
  if (country) query.country = country;
  if (search) {
    const pattern = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ firstName: pattern }, { lastName: pattern }];
  }
  const [authors, total] = await Promise.all([
    Author.find(query).sort(sortOf(sortBy)).skip((page - 1) * limit).limit(limit).lean(),
    Author.countDocuments(query),
  ]);
  const counts = authors.length ? await Book.aggregate([
    { $match: { author: { $in: authors.map((author) => author._id) } } },
    { $group: { _id: "$author", count: { $sum: 1 } } },
  ]) : [];
  const byId = new Map(counts.map((row) => [String(row._id), row.count]));
  return {
    authors: authors.map((author) => toAuthorView(author, byId.get(String(author._id)) ?? 0)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get author by ID
 * @param {string} id - Author ID
 * @param {boolean} includeBooks - Whether to populate books
 * @returns {Object} Author document
 */
export async function getAuthorById(id, includeBooks = false) {
  const author = await Author.findById(id).lean();
  if (!author) throw new NotFoundError("Author not found");
  if (includeBooks) {
    const books = await Book.find({ author: id }).populate("author", "firstName lastName")
      .sort(sortOf("-publicationYear")).lean();
    return { author: toAuthorView(author, books.length), books: books.map(toBookView) };
  }
  return toAuthorView(author, await Book.countDocuments({ author: id }));
}

/**
 * Create new author
 * @param {Object} authorData - Author data (firstName, lastName, bio, birthYear, country, website)
 * @returns {Object} Created author
 */
const AUTHOR_FIELDS = ["firstName", "lastName", "bio", "birthYear", "country", "website"];
const OPTIONAL_FIELDS = ["bio", "birthYear", "country", "website"];
const storedFields = (data) => Object.fromEntries(AUTHOR_FIELDS.filter((field) => Object.hasOwn(data, field)).map((field) => [field, data[field]]));

async function refuseDuplicate({ firstName, lastName }, id) {
  const duplicate = await Author.exists({ firstName, lastName, ...(id && { _id: { $ne: id } }) });
  if (duplicate) throw new AppError("An author with this name already exists", 409, "CONFLICT", { fields: { lastName: "duplicate" } });
}

export async function createAuthor(authorData) {
  await refuseDuplicate(authorData);
  return toAuthorView(await Author.create(storedFields(authorData)));
}

/**
 * Update author
 * @param {string} id - Author ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated author
 */
export async function updateAuthor(id, updateData) {
  if (!(await Author.exists({ _id: id }))) throw new NotFoundError("Author not found");
  await refuseDuplicate(updateData, id);
  const unset = Object.fromEntries(OPTIONAL_FIELDS.filter((field) => !Object.hasOwn(updateData, field)).map((field) => [field, ""]));
  const author = await Author.findByIdAndUpdate(id, {
    $set: storedFields(updateData), $unset: { ...unset, books: "" },
  }, {
    // Only the allowlisted update above may unset the removed legacy schema path.
    new: true, runValidators: true, strict: false,
  }).lean();
  if (!author) throw new NotFoundError("Author not found");
  return toAuthorView(author);
}

/**
 * Delete author
 * @param {string} id - Author ID
 * @returns {Promise<void>} Refuses an author that still has books
 */
export async function deleteAuthor(id) {
  if (!(await Author.exists({ _id: id }))) throw new NotFoundError("Author not found");
  const bookCount = await Book.countDocuments({ author: id });
  if (bookCount > 0) throw new ConflictError("This author still has books", "AUTHOR_HAS_BOOKS", { books: bookCount });
  await Author.findByIdAndDelete(id);
}

/**
 * Get authors of exactly one country
 * @param {string} country - Country name
 * @param {Object} options - Parsed countryAuthorsQuery (limit, sortBy)
 * @returns {Array} Authors from country
 */
export async function getAuthorsByCountry(country, { limit, sortBy }) {
  const authors = await Author.find({ country }).sort(sortOf(sortBy)).limit(limit).lean();
  return authors.map((author) => toAuthorView(author));
}

/**
 * Get author's books
 * @param {string} id - Author ID
 * @param {Object} filters - Filter options (limit, sortBy, inStock)
 * @returns {Array} Author's books
 */
export async function getAuthorBooks(id, filters = {}) {
  // Verify author exists
  const author = await Author.findById(id);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  const { limit = 50, sortBy = "-publicationYear", inStock } = filters;

  // Build query
  const query = { author: id };
  if (inStock !== undefined) {
    query.inStock = inStock;
  }

  const books = await Book.find(query).populate("author", "firstName lastName")
    .sort(sortOf(sortBy)).limit(limit).lean();
  return books.map(toBookView);
}

/**
 * Get author statistics
 * @param {string} id - Author ID
 * @returns {Object} Author stats
 */
export async function getAuthorStats(id) {
  // Verify author exists
  const author = await Author.findById(id).lean();
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  // Get books statistics
  const books = await Book.find({ author: id }).lean();

  const stats = {
    totalBooks: books.length,
    booksInStock: books.filter((b) => b.inStock).length,
    booksOutOfStock: books.filter((b) => !b.inStock).length,
    categories: [...new Set(books.map((b) => b.category).filter(Boolean))],
    publicationYears: {
      earliest:
        books.length > 0
          ? Math.min(...books.map((b) => b.publicationYear))
          : null,
      latest:
        books.length > 0
          ? Math.max(...books.map((b) => b.publicationYear))
          : null,
    },
    pricing: {
      lowest: books.length > 0 ? Math.min(...books.map((b) => b.price)) : null,
      highest: books.length > 0 ? Math.max(...books.map((b) => b.price)) : null,
      average:
        books.length > 0
          ? (books.reduce((sum, b) => sum + b.price, 0) / books.length).toFixed(
              2
            )
          : null,
    },
  };

  return {
    author: toAuthorView(author, books.length),
    statistics: stats,
  };
}
