import * as bookService from '../services/bookService.js';

/**
 * @route   GET /api/v1/books
 * @desc    Get all books with filtering
 * @access  Public
 */
export async function getBooks(req, res) {
  const result = await bookService.getBooks(req.query);

  res.status(200).json({
    success: true,
    data: result.books,
    pagination: result.pagination
  });
}

/**
 * @route   GET /api/v1/books/:id
 * @desc    Get book by ID
 * @access  Public
 */
export async function getBook(req, res) {
  const book = await bookService.getBookById(req.params.id);

  res.status(200).json({
    success: true,
    data: book
  });
}

/**
 * @route   POST /api/v1/books
 * @desc    Create new book
 * @access  Private/Admin
 */
export async function createBook(req, res) {
  const bookData = {
    ...req.body,
    image: req.file?.path
  };

  const book = await bookService.createBook(bookData);

  res.status(201).json({
    success: true,
    data: book,
    message: 'Book created successfully'
  });
}

/**
 * @route   PUT /api/v1/books/:id
 * @desc    Update book
 * @access  Private/Admin
 */
export async function updateBook(req, res) {
  const updateData = {
    ...req.body,
    ...(req.file && { image: req.file.path })
  };

  const book = await bookService.updateBook(req.params.id, updateData);

  res.status(200).json({
    success: true,
    data: book,
    message: 'Book updated successfully'
  });
}

/**
 * @route   DELETE /api/v1/books/:id
 * @desc    Delete book
 * @access  Private/Admin
 */
export async function deleteBook(req, res) {
  await bookService.deleteBook(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Book deleted successfully'
  });
}

/**
 * @route   GET /api/v1/books/category/:category
 * @desc    Get books by category
 * @access  Public
 */
export async function getBooksByCategory(req, res) {
  const books = await bookService.getBooksByCategory(
    req.params.category,
    req.query
  );

  res.status(200).json({
    success: true,
    count: books.length,
    data: books
  });
}

/**
 * @route   PATCH /api/v1/books/:id/stock
 * @desc    Update book stock status
 * @access  Private/Admin
 */
export async function updateBookStock(req, res) {
  const { inStock } = req.body;
  
  const book = await bookService.updateBookStock(req.params.id, inStock);

  res.status(200).json({
    success: true,
    data: book
  });
}
