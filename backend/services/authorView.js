/** The author contract deliberately excludes the legacy books array. */
export function toAuthorView(doc, booksCount) {
  return {
    id: doc._id.toString(),
    firstName: doc.firstName,
    lastName: doc.lastName,
    bio: doc.bio ?? "",
    birthYear: doc.birthYear,
    country: doc.country,
    website: doc.website,
    ...(booksCount !== undefined && { booksCount }),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
