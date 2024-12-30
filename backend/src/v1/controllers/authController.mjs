import AuthorsDBService from '../models/author/AuthorsDBService.mjs';
import { validationResult } from 'express-validator';

export const getAllAuthors = async (req, res) => {
  try {
    const authors = await AuthorsDBService.getList();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAuthorWithBooks = async (req, res) => {
  try {
    const author = await AuthorsDBService.getAuthorWithBooks(req.params.id);
    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(author);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAuthor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newAuthor = await AuthorsDBService.create(req.body);
    res.status(201).json(newAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAuthor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updatedAuthor = await AuthorsDBService.update(
      req.params.id,
      req.body,
    );
    if (!updatedAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(updatedAuthor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAuthor = async (req, res) => {
  try {
    const deletedAuthor = await AuthorsDBService.deleteById(req.params.id);
    if (!deletedAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
