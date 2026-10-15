/**
 * Test data factories
 * createAuthor() and createBook() save a valid document through the model;
 * overrides replace the default fields. createBook() creates an author unless
 * one is given.
 */

import Author from "../../models/Author.js";
import Book from "../../models/Book.js";

export async function createAuthor(overrides = {}) {
  return Author.create({
    firstName: "Karel",
    lastName: "Čapek",
    ...overrides,
  });
}

export async function createBook(overrides = {}) {
  const author = overrides.author ?? (await createAuthor())._id;
  return Book.create({
    title: "R.U.R.",
    publicationYear: 1920,
    price: 10.99,
    inStock: true,
    ...overrides,
    author,
  });
}
