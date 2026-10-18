/**
 * Request schemas of the book reads
 */

import { z } from "zod";
import { limit, objectId, page, sortBy, text } from "./common.js";

export const BOOK_SORTS = [
  "-createdAt",
  "createdAt",
  "title",
  "-title",
  "price",
  "-price",
  "publicationYear",
  "-publicationYear",
];

// The same length limit as the Book model's category
const category = text(50);

export const listBooksQuery = z.strictObject({
  page,
  limit: limit(100, 20),
  category: category.optional(),
  authorId: objectId.optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  search: text(100).optional(),
  sortBy: sortBy(BOOK_SORTS, "-createdAt"),
});

export const bookIdParams = z.strictObject({ id: objectId });

export const categoryParams = z.strictObject({ category });

export const categoryBooksQuery = z.strictObject({
  limit: limit(100, 20),
  sortBy: sortBy(BOOK_SORTS, "-createdAt"),
});

export const authorIdParams = z.strictObject({ authorId: objectId });

export const authorBooksQuery = z.strictObject({
  limit: limit(100, 50),
  sortBy: sortBy(BOOK_SORTS, "-publicationYear"),
});
