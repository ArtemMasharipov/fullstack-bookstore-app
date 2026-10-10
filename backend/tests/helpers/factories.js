/**
 * Test data factories
 * createAuthor() saves a valid author through the model; overrides replace the
 * default fields.
 */

import Author from "../../models/Author.js";

export async function createAuthor(overrides = {}) {
  return Author.create({
    firstName: "Karel",
    lastName: "Čapek",
    ...overrides,
  });
}
