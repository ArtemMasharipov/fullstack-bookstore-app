/**
 * The public shape of a book: a string id and no Mongoose internals. The
 * author is the populated reference; null when the author no longer exists.
 */

function authorOf(author) {
  if (!author?.firstName) return null;
  return {
    id: author._id.toString(),
    firstName: author.firstName,
    lastName: author.lastName,
    ...(author.bio !== undefined && { bio: author.bio }),
  };
}

export function toBookView(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    author: authorOf(doc.author),
    publicationYear: doc.publicationYear,
    category: doc.category,
    description: doc.description,
    price: doc.price,
    image: doc.image,
    inStock: doc.inStock,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
