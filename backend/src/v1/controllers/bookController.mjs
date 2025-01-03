import BooksDBService from '../models/book/BooksDBService.mjs';
import { validationResult } from 'express-validator';

const handleErrors = (res, error, status = 500) => {
  res.status(status).json({ error: error.message || error });
};

const validateRequest = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
};

export const getAllBooks = async (req, res) => {
  try {
    const books = await BooksDBService.getList();
    res.json(books);
  } catch (error) {
    handleErrors(res, error);
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await BooksDBService.getById(req.params.id);
    if (!book) return handleErrors(res, 'Book not found', 404);
    res.json(book);
  } catch (error) {
    handleErrors(res, error);
  }
};

export const createBook = async (req, res) => {
  console.log('Request headers:', req.headers); // Логируем заголовки запроса
  console.log('Request body:', req.body); // Логируем тело запроса
  console.log('Request file:', req.file); // Проверяем файл

  if (!validateRequest(req, res)) return;

  try {
    const { authorId, ...rest } = req.body;
    const imageUrl = req.file ? req.file.path : null;
    const bookData = { ...rest, author: authorId, image: imageUrl };
    const newBook = await BooksDBService.create(bookData);
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    handleErrors(res, error);
  }
};

export const updateBook = async (req, res) => {
  if (!validateRequest(req, res)) return;

  try {
    let updatedData = req.body;

    if (req.file) {
      const imageUrl = req.file.path;
      updatedData = { ...updatedData, image: imageUrl };
    }

    const updatedBook = await BooksDBService.update(req.params.id, updatedData);
    if (!updatedBook) return handleErrors(res, 'Book not found', 404);
    res.json(updatedBook);
  } catch (error) {
    handleErrors(res, error);
  }
};

export const deleteBook = async (req, res) => {
  try {
    const deletedBook = await BooksDBService.deleteById(req.params.id);
    if (!deletedBook) return handleErrors(res, 'Book not found', 404);
    res.status(204).end();
  } catch (error) {
    handleErrors(res, error);
  }
};
