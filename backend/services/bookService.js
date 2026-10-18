/**
 * Book Service Layer
 * Contains ALL business logic for books
 * No HTTP/request/response handling here!
 */

import Author from "../models/Author.js";
import Book from "../models/Book.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
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

/**
 * Create new book
 * @param {Object} bookData - Book data (title, authorId, publicationYear, category, description, price, image, inStock)
 * @returns {Object} Created book
 */
export async function createBook(bookData) {
  // Validate author exists
  if (!bookData.authorId) {
    throw new ValidationError("Author ID is required");
  }

  const author = await Author.findById(bookData.authorId);
  if (!author) {
    throw new NotFoundError("Author not found");
  }

  // Check for duplicates (same title + author + year)
  const existingBook = await Book.findOne({
    title: bookData.title,
    author: bookData.authorId,
    publicationYear: bookData.publicationYear,
  });

  if (existingBook) {
    throw new ValidationError(
      "Book with this title already exists for this author and year"
    );
  }

  // Create book
  const book = new Book({
    ...bookData,
    author: bookData.authorId,
  });

  await book.save();
  await book.populate("author", "firstName lastName");

  return book;
}

/**
 * Update book
 * @param {string} id - Book ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated book
 */
export async function updateBook(id, updateData) {
  // Check book exists
  const existingBook = await Book.findById(id);
  if (!existingBook) {
    throw new NotFoundError("Book not found");
  }

  // Validate new author if changing
  if (
    updateData.authorId &&
    updateData.authorId !== existingBook.author.toString()
  ) {
    const author = await Author.findById(updateData.authorId);
    if (!author) {
      throw new NotFoundError("Author not found");
    }
    updateData.author = updateData.authorId;
    delete updateData.authorId;
  }

  // Prevent modifying certain fields
  delete updateData.createdAt;
  delete updateData._id;

  // Update
  const book = await Book.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate("author", "firstName lastName");

  return book;
}

/**
 * Delete book
 * @param {string} id - Book ID
 * @returns {Object} Success message
 */
export async function deleteBook(id) {
  const book = await Book.findById(id);

  if (!book) {
    throw new NotFoundError("Book not found");
  }

  await Book.findByIdAndDelete(id);

  return { message: "Book deleted successfully" };
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
 * Update book stock status
 * @param {string} id - Book ID
 * @param {boolean} inStock - Stock status
 * @returns {Object} Updated book
 */
export async function updateBookStock(id, inStock) {
  const book = await Book.findByIdAndUpdate(
    id,
    { inStock },
    { new: true, runValidators: true }
  ).populate("author", "firstName lastName");

  if (!book) {
    throw new NotFoundError("Book not found");
  }

  return book;
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
