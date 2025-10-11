/**
 * Book Service Layer
 * Contains ALL business logic for books
 * No HTTP/request/response handling here!
 */

import Author from '../models/Author.js'
import Book from '../models/Book.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

/**
 * Get books with filtering and pagination
 * @param {Object} filters - Query filters (page, limit, category, authorId, inStock, search, sortBy)
 * @returns {Object} { books, pagination }
 */
export async function getBooks(filters = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    authorId,
    inStock,
    search,
    sortBy = '-createdAt',
  } = filters

  // Validate pagination params
  if (page < 1 || limit < 1) {
    throw new ValidationError('Page and limit must be greater than 0')
  }

  if (limit > 100) {
    throw new ValidationError('Maximum limit is 100')
  }

  // Build query
  const query = {}
  if (category) query.category = new RegExp(category, 'i')
  if (authorId) query.author = authorId
  if (inStock !== undefined) query.inStock = inStock === 'true'

  const skip = (page - 1) * limit

  // Search vs regular query
  let booksQuery
  if (search) {
    booksQuery = Book.searchBooks(search).skip(skip).limit(Number(limit))
  } else {
    booksQuery = Book.find(query)
      .populate('author', 'firstName lastName')
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .lean()
  }

  // Execute queries in parallel
  const [books, total] = await Promise.all([
    booksQuery,
    Book.countDocuments(search ? { $text: { $search: search } } : query),
  ])

  return {
    books,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

/**
 * Get book by ID
 * @param {string} id - Book ID
 * @returns {Object} Book document
 */
export async function getBookById(id) {
  const book = await Book.findById(id)
    .populate('author', 'firstName lastName bio')
    .lean()

  if (!book) {
    throw new NotFoundError('Book not found')
  }

  return book
}

/**
 * Create new book
 * @param {Object} bookData - Book data (title, authorId, publicationYear, category, description, price, image, inStock)
 * @returns {Object} Created book
 */
export async function createBook(bookData) {
  // Validate author exists
  if (!bookData.authorId) {
    throw new ValidationError('Author ID is required')
  }

  const author = await Author.findById(bookData.authorId)
  if (!author) {
    throw new NotFoundError('Author not found')
  }

  // Check for duplicates (same title + author + year)
  const existingBook = await Book.findOne({
    title: bookData.title,
    author: bookData.authorId,
    publicationYear: bookData.publicationYear,
  })

  if (existingBook) {
    throw new ValidationError(
      'Book with this title already exists for this author and year'
    )
  }

  // Create book
  const book = new Book({
    ...bookData,
    author: bookData.authorId,
  })

  await book.save()
  await book.populate('author', 'firstName lastName')

  return book
}

/**
 * Update book
 * @param {string} id - Book ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated book
 */
export async function updateBook(id, updateData) {
  // Check book exists
  const existingBook = await Book.findById(id)
  if (!existingBook) {
    throw new NotFoundError('Book not found')
  }

  // Validate new author if changing
  if (
    updateData.authorId &&
    updateData.authorId !== existingBook.author.toString()
  ) {
    const author = await Author.findById(updateData.authorId)
    if (!author) {
      throw new NotFoundError('Author not found')
    }
    updateData.author = updateData.authorId
    delete updateData.authorId
  }

  // Prevent modifying certain fields
  delete updateData.createdAt
  delete updateData._id

  // Update
  const book = await Book.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).populate('author', 'firstName lastName')

  return book
}

/**
 * Delete book
 * @param {string} id - Book ID
 * @returns {Object} Success message
 */
export async function deleteBook(id) {
  const book = await Book.findById(id)

  if (!book) {
    throw new NotFoundError('Book not found')
  }

  await Book.findByIdAndDelete(id)

  return { message: 'Book deleted successfully' }
}

/**
 * Get books by category
 * @param {string} category - Category name
 * @param {Object} options - Additional options (limit, sortBy)
 * @returns {Array} Books in category
 */
export async function getBooksByCategory(category, options = {}) {
  const { limit = 20, sortBy = '-createdAt' } = options

  const books = await Book.find({
    category: new RegExp(category, 'i'),
    inStock: true,
  })
    .populate('author', 'firstName lastName')
    .sort(sortBy)
    .limit(Number(limit))
    .lean()

  return books
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
  ).populate('author', 'firstName lastName')

  if (!book) {
    throw new NotFoundError('Book not found')
  }

  return book
}

/**
 * Get books by author
 * @param {string} authorId - Author ID
 * @param {Object} options - Additional options (limit, sortBy)
 * @returns {Array} Author's books
 */
export async function getBooksByAuthor(authorId, options = {}) {
  const { limit = 50, sortBy = '-publicationYear' } = options

  // Verify author exists
  const author = await Author.findById(authorId)
  if (!author) {
    throw new NotFoundError('Author not found')
  }

  const books = await Book.find({ author: authorId })
    .sort(sortBy)
    .limit(Number(limit))
    .lean()

  return books
}
