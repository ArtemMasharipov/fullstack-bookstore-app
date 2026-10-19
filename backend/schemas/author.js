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

const birthYear = z.number().int().min(1000).superRefine((year, ctx) => {
  const maximum = new Date().getFullYear();
  if (year > maximum) ctx.addIssue({ code: "too_big", origin: "number", maximum, inclusive: true });
});
const website = z.string().trim().max(2048).superRefine((value, ctx) => {
  try {
    if (["http:", "https:"].includes(new URL(value).protocol)) return;
  } catch { /* Invalid URLs use the same public validation code. */ }
  ctx.addIssue({ code: "invalid_format", format: "url" });
});

export const authorBody = z.strictObject({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  bio: z.string().trim().max(2000).optional(),
  birthYear: birthYear.optional(),
  country: z.string().trim().max(100).optional(),
  website: website.optional(),
});
