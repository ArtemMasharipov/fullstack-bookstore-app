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
  ConflictError,
  NotFoundError,
  ValidationError,
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
export async function createAuthor(authorData) {
  // Validate required fields
  if (!authorData.firstName || !authorData.lastName) {
    throw new ValidationError("First name and last name are required");
  }

  // Check for duplicate author (same first + last name)
  const existingAuthor = await Author.findOne({
    firstName: authorData.firstName,
    lastName: authorData.lastName,
  });

  if (existingAuthor) {
    throw new ConflictError(
      `Author ${authorData.firstName} ${authorData.lastName} already exists`
    );
  }

  // Validate birth year if provided
  if (authorData.birthYear) {
    const currentYear = new Date().getFullYear();
    if (authorData.birthYear > currentYear) {
      throw new ValidationError("Birth year cannot be in the future");
    }
    if (authorData.birthYear < 1000) {
      throw new ValidationError("Birth year cannot be before 1000");
    }
  }

  // Create author
  const author = new Author(authorData);
  await author.save();

  return author;
}

/**
 * Update author
 * @param {string} id - Author ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated author
 */
export async function updateAuthor(id, updateData) {
  // Check author exists
  const existingAuthor = await Author.findById(id);
  if (!existingAuthor) {
    throw new NotFoundError("Author not found");
  }

  // If updating name, check for duplicates
  if (updateData.firstName || updateData.lastName) {
    const firstName = updateData.firstName || existingAuthor.firstName;
    const lastName = updateData.lastName || existingAuthor.lastName;

    const duplicate = await Author.findOne({
      firstName,
      lastName,
      _id: { $ne: id }, // Exclude current author
    });

    if (duplicate) {
      throw new ConflictError(`Author ${firstName} ${lastName} already exists`);
    }
  }

  // Prevent modifying certain fields
  delete updateData.createdAt;
  delete updateData._id;
  delete updateData.books; // Managed automatically

  // Update
  const author = await Author.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean();

  return author;
}

/**
 * Delete author
 * @param {string} id - Author ID
 * @param {boolean} deleteBooks - Whether to delete author's books
 * @returns {Object} Success message
 */
export async function deleteAuthor(id, deleteBooks = false) {
  const author = await Author.findById(id);

  if (!author) {
    throw new NotFoundError("Author not found");
  }

  // Check if author has books
  const bookCount = await Book.countDocuments({ author: id });

  if (bookCount > 0 && !deleteBooks) {
    throw new ValidationError(
      `Cannot delete author with ${bookCount} book(s). Set deleteBooks=true to delete books as well.`
    );
  }

  // Delete books if requested
  if (deleteBooks && bookCount > 0) {
    await Book.deleteMany({ author: id });
  }

  await Author.findByIdAndDelete(id);

  return {
    message: "Author deleted successfully",
    booksDeleted: deleteBooks ? bookCount : 0,
  };
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
