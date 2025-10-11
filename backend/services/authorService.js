/**
 * Author Service Layer
 * Contains ALL business logic for authors
 * No HTTP/request/response handling here!
 */

import Author from '../models/Author.js'
import Book from '../models/Book.js'
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js'

/**
 * Get authors with filtering and pagination
 * @param {Object} filters - Query filters (page, limit, country, search, sortBy)
 * @returns {Object} { authors, pagination }
 */
export async function getAuthors(filters = {}) {
  const {
    page = 1,
    limit = 20,
    country,
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
  if (country) query.country = new RegExp(country, 'i')

  const skip = (page - 1) * limit

  // Search vs regular query
  let authorsQuery
  if (search) {
    authorsQuery = Author.searchAuthors(search).skip(skip).limit(Number(limit))
  } else {
    authorsQuery = Author.find(query)
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit))
      .lean()
  }

  // Execute queries in parallel
  const [authors, total] = await Promise.all([
    authorsQuery,
    Author.countDocuments(search ? { $text: { $search: search } } : query),
  ])

  // Get book count for each author
  const authorsWithBookCount = await Promise.all(
    authors.map(async author => {
      const bookCount = await Book.countDocuments({ author: author._id })
      return { ...author, booksCount: bookCount }
    })
  )

  return {
    authors: authorsWithBookCount,
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
 * Get author by ID
 * @param {string} id - Author ID
 * @param {boolean} includeBooks - Whether to populate books
 * @returns {Object} Author document
 */
export async function getAuthorById(id, includeBooks = false) {
  let query = Author.findById(id)

  if (includeBooks) {
    query = query.populate(
      'books',
      'title publicationYear price inStock category'
    )
  }

  const author = await query.lean()

  if (!author) {
    throw new NotFoundError('Author not found')
  }

  // Get book count if not populated
  if (!includeBooks) {
    const bookCount = await Book.countDocuments({ author: id })
    author.booksCount = bookCount
  }

  return author
}

/**
 * Create new author
 * @param {Object} authorData - Author data (firstName, lastName, bio, birthYear, country, website)
 * @returns {Object} Created author
 */
export async function createAuthor(authorData) {
  // Validate required fields
  if (!authorData.firstName || !authorData.lastName) {
    throw new ValidationError('First name and last name are required')
  }

  // Check for duplicate author (same first + last name)
  const existingAuthor = await Author.findOne({
    firstName: authorData.firstName,
    lastName: authorData.lastName,
  })

  if (existingAuthor) {
    throw new ConflictError(
      `Author ${authorData.firstName} ${authorData.lastName} already exists`
    )
  }

  // Validate birth year if provided
  if (authorData.birthYear) {
    const currentYear = new Date().getFullYear()
    if (authorData.birthYear > currentYear) {
      throw new ValidationError('Birth year cannot be in the future')
    }
    if (authorData.birthYear < 1000) {
      throw new ValidationError('Birth year cannot be before 1000')
    }
  }

  // Create author
  const author = new Author(authorData)
  await author.save()

  return author
}

/**
 * Update author
 * @param {string} id - Author ID
 * @param {Object} updateData - Fields to update
 * @returns {Object} Updated author
 */
export async function updateAuthor(id, updateData) {
  // Check author exists
  const existingAuthor = await Author.findById(id)
  if (!existingAuthor) {
    throw new NotFoundError('Author not found')
  }

  // If updating name, check for duplicates
  if (updateData.firstName || updateData.lastName) {
    const firstName = updateData.firstName || existingAuthor.firstName
    const lastName = updateData.lastName || existingAuthor.lastName

    const duplicate = await Author.findOne({
      firstName,
      lastName,
      _id: { $ne: id }, // Exclude current author
    })

    if (duplicate) {
      throw new ConflictError(`Author ${firstName} ${lastName} already exists`)
    }
  }

  // Prevent modifying certain fields
  delete updateData.createdAt
  delete updateData._id
  delete updateData.books // Managed automatically

  // Update
  const author = await Author.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).lean()

  return author
}

/**
 * Delete author
 * @param {string} id - Author ID
 * @param {boolean} deleteBooks - Whether to delete author's books
 * @returns {Object} Success message
 */
export async function deleteAuthor(id, deleteBooks = false) {
  const author = await Author.findById(id)

  if (!author) {
    throw new NotFoundError('Author not found')
  }

  // Check if author has books
  const bookCount = await Book.countDocuments({ author: id })

  if (bookCount > 0 && !deleteBooks) {
    throw new ValidationError(
      `Cannot delete author with ${bookCount} book(s). Set deleteBooks=true to delete books as well.`
    )
  }

  // Delete books if requested
  if (deleteBooks && bookCount > 0) {
    await Book.deleteMany({ author: id })
  }

  await Author.findByIdAndDelete(id)

  return {
    message: 'Author deleted successfully',
    booksDeleted: deleteBooks ? bookCount : 0,
  }
}

/**
 * Get authors by country
 * @param {string} country - Country name
 * @param {Object} options - Additional options (limit, sortBy)
 * @returns {Array} Authors from country
 */
export async function getAuthorsByCountry(country, options = {}) {
  const { limit = 50, sortBy = 'lastName' } = options

  const authors = await Author.find({
    country: new RegExp(country, 'i'),
  })
    .sort(sortBy)
    .limit(Number(limit))
    .lean()

  return authors
}

/**
 * Get author's books
 * @param {string} id - Author ID
 * @param {Object} filters - Filter options (limit, sortBy, inStock)
 * @returns {Array} Author's books
 */
export async function getAuthorBooks(id, filters = {}) {
  // Verify author exists
  const author = await Author.findById(id)
  if (!author) {
    throw new NotFoundError('Author not found')
  }

  const { limit = 50, sortBy = '-publicationYear', inStock } = filters

  // Build query
  const query = { author: id }
  if (inStock !== undefined) {
    query.inStock = inStock === 'true'
  }

  const books = await Book.find(query).sort(sortBy).limit(Number(limit)).lean()

  return books
}

/**
 * Get author statistics
 * @param {string} id - Author ID
 * @returns {Object} Author stats
 */
export async function getAuthorStats(id) {
  // Verify author exists
  const author = await Author.findById(id).lean()
  if (!author) {
    throw new NotFoundError('Author not found')
  }

  // Get books statistics
  const books = await Book.find({ author: id }).lean()

  const stats = {
    totalBooks: books.length,
    booksInStock: books.filter(b => b.inStock).length,
    booksOutOfStock: books.filter(b => !b.inStock).length,
    categories: [...new Set(books.map(b => b.category).filter(Boolean))],
    publicationYears: {
      earliest:
        books.length > 0
          ? Math.min(...books.map(b => b.publicationYear))
          : null,
      latest:
        books.length > 0
          ? Math.max(...books.map(b => b.publicationYear))
          : null,
    },
    pricing: {
      lowest: books.length > 0 ? Math.min(...books.map(b => b.price)) : null,
      highest: books.length > 0 ? Math.max(...books.map(b => b.price)) : null,
      average:
        books.length > 0
          ? (books.reduce((sum, b) => sum + b.price, 0) / books.length).toFixed(
              2
            )
          : null,
    },
  }

  return {
    author: {
      id: author._id,
      fullName: `${author.firstName} ${author.lastName}`,
      country: author.country,
      birthYear: author.birthYear,
    },
    statistics: stats,
  }
}
