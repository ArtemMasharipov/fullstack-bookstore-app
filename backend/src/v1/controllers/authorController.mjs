import AuthorsDBService from '../models/author/AuthorsDBService.mjs';
import { validationResult } from 'express-validator';

export const getAllAuthors = async (req, res) => {
  try {
    const authors = await AuthorsDBService.getAuthors();
    res.json(authors);
  } catch (error) {
    console.error('Error fetching authors:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
    console.error('Error fetching author:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const createAuthor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, biography } = req.body;

  try {
    const newAuthor = await AuthorsDBService.createAuthor({ name, biography });
    res.status(201).json(newAuthor);
  } catch (error) {
    console.error('Error creating author:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const updateAuthor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, biography } = req.body;

  try {
    const updatedAuthor = await AuthorsDBService.updateAuthor(req.params.id, { name, biography });
    if (!updatedAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.json(updatedAuthor);
  } catch (error) {
    console.error('Error updating author:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteAuthor = async (req, res) => {
  try {
    const deletedAuthor = await AuthorsDBService.deleteAuthor(req.params.id);
    if (!deletedAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting author:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
