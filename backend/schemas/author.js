/**
 * Request schemas of the author list reads
 */

import { z } from "zod";
import { limit, objectId, page, sortBy, text } from "./common.js";
import { BOOK_SORTS } from "./book.js";

export const AUTHOR_SORTS = [
  "-createdAt",
  "createdAt",
  "lastName",
  "-lastName",
  "firstName",
  "-firstName",
  "birthYear",
  "-birthYear",
];

// The same length limit as the Author model's country
const country = text(100);

export const listAuthorsQuery = z.strictObject({
  page,
  limit: limit(100, 20),
  country: country.optional(),
  search: text(100).optional(),
  sortBy: sortBy(AUTHOR_SORTS, "-createdAt"),
});

export const countryParams = z.strictObject({ country });

export const countryAuthorsQuery = z.strictObject({
  limit: limit(100, 50),
  sortBy: sortBy(AUTHOR_SORTS, "lastName"),
});

export const authorIdParams = z.strictObject({ id: objectId });
export const emptyAuthorQuery = z.strictObject({});
export const authorDetailQuery = z.strictObject({
  includeBooks: z.enum(["true", "false"]).transform((value) => value === "true").default(false),
});
export const authorBooksQuery = z.strictObject({
  limit: limit(100, 50),
  sortBy: sortBy(BOOK_SORTS, "-publicationYear"),
  inStock: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
