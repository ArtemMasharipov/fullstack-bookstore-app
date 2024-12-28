import BooksDBService from '../models/book/BooksDBService.mjs';
import { validationResult } from 'express-validator';

export const getAllBooks = async (req, res) => {
  try {
    const books = await BooksDBService.getBooks();
    res.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await BooksDBService.getBookById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createBook = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, authorId, publicationYear, category, imgBase64 } = req.body;

  try {
    const newBook = await BooksDBService.createBook({ title, authorId, publicationYear, category, imgBase64 });
    res.status(201).json(newBook);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateBook = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, authorId, publicationYear, category, imgBase64 } = req.body;

  try {
    const updatedBook = await BooksDBService.updateBook(req.params.id, { title, authorId, publicationYear, category, imgBase64 });
    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json(updatedBook);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const deletedBook = await BooksDBService.deleteBook(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
