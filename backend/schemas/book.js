/**
 * Request schemas of the book reads and writes
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

// The current year is read at each check, not once when the module loads
const publicationYear = z
  .number()
  .int()
  .min(1450)
  .superRefine((year, ctx) => {
    const maximum = new Date().getFullYear();
    if (year > maximum) {
      ctx.addIssue({ code: "too_big", origin: "number", maximum, inclusive: true, input: year });
    }
  });

// The seed stores its covers as data URIs of these image types
const DATA_IMAGE = /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/;

const isHttps = (value) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

// A cover is an https link (http would be mixed content on an https site) or a
// data URI of an image
const image = z
  .string()
  .trim()
  .max(200_000)
  .superRefine((value, ctx) => {
    if (DATA_IMAGE.test(value)) return;
    if (!isHttps(value)) {
      ctx.addIssue({ code: "invalid_format", format: "url", input: value });
    } else if (value.length > 2048) {
      ctx.addIssue({ code: "too_big", origin: "string", maximum: 2048, inclusive: true, input: value });
    }
  });

// The body of POST and PUT: PUT replaces the book, so an optional field that
// the body leaves out is removed
export const bookBody = z.strictObject({
  title: z.string().trim().min(2).max(100),
  authorId: objectId,
  publicationYear,
  category,
  description: z.string().trim().max(1000).optional(),
  price: z.number().min(0).max(999999.99).multipleOf(0.01),
  image: image.optional(),
  inStock: z.boolean().default(true),
});

export const bookStockBody = z.strictObject({ inStock: z.boolean() });
