/**
 * Request schemas of the author list reads
 */

import { z } from "zod";
import { limit, page, sortBy, text } from "./common.js";

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
