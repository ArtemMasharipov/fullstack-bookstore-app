/**
 * Seed data
 * Demo data for layout checks and the e2e smoke test, not a catalogue: the
 * titles are real public-domain works, the years and prices are indicative.
 * It has what a catalogue page must survive: books without a cover, one that
 * is out of stock, a title that fills the whole card, Czech diacritics and
 * Cyrillic. The catalogue lists 12 books per page, newest first, and the last
 * 12 books below hold each of those cases, so the first page shows them all.
 * No imports: the Playwright smoke test imports SMOKE_BOOK_TITLE from here.
 */

export const SEED_USERS = {
  admin: { username: "admin", email: "admin@bookstore.local" },
  user: { username: "reader", email: "reader@bookstore.local" },
};

// The book the smoke test looks for. It is the last one in BOOKS, so the newest
export const SMOKE_BOOK_TITLE = "Babička";

// A cover is a data URI of a coloured rectangle: showing it requests nothing
// from the network
const cover = (color) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300">' +
      `<rect width="200" height="300" fill="${color}"/>` +
      "</svg>"
  );

export const AUTHORS = [
  {
    firstName: "Karel",
    lastName: "Čapek",
    birthYear: 1890,
    country: "Czech Republic",
    bio: "Czech writer and playwright, author of R.U.R. and Krakatit.",
  },
  {
    firstName: "Božena",
    lastName: "Němcová",
    birthYear: 1820,
    country: "Czech Republic",
    bio: "Czech writer whose novel Babička is a classic of Czech literature.",
  },
  {
    firstName: "Jaroslav",
    lastName: "Hašek",
    birthYear: 1883,
    country: "Czech Republic",
    bio: "Czech humorist and satirist, author of The Good Soldier Švejk.",
  },
  {
    firstName: "Mikhail",
    lastName: "Bulgakov",
    birthYear: 1891,
    country: "Russia",
    bio: "Russian novelist and playwright, author of The Master and Margarita.",
  },
  {
    firstName: "Charles",
    lastName: "Darwin",
    birthYear: 1809,
    country: "United Kingdom",
    bio: "English naturalist, author of On the Origin of Species.",
  },
];

// Indexes into AUTHORS
const CAPEK = 0;
const NEMCOVA = 1;
const HASEK = 2;
const BULGAKOV = 3;
const DARWIN = 4;

// In the order they are created. A book without image shows the placeholder;
// without inStock it is in stock.
export const BOOKS = [
  // Older books: the second catalogue page and beyond
  {
    title: "R.U.R.",
    author: CAPEK,
    publicationYear: 1920,
    category: "Science Fiction",
    price: 199,
    image: cover("#2f5d62"),
  },
  {
    title: "Válka s mloky",
    author: CAPEK,
    publicationYear: 1936,
    category: "Science Fiction",
    price: 329,
    image: cover("#44505a"),
  },
  {
    title: "Krakatit",
    author: CAPEK,
    publicationYear: 1924,
    category: "Science Fiction",
    price: 279,
    image: cover("#7a2e3a"),
  },
  {
    title: "Hordubal",
    author: CAPEK,
    publicationYear: 1933,
    category: "Fiction",
    price: 249.9,
  },
  {
    title: "On the Origin of Species",
    author: DARWIN,
    publicationYear: 1859,
    category: "Science",
    price: 349,
    image: cover("#5b6b3a"),
  },
  {
    title: "The Voyage of the Beagle",
    author: DARWIN,
    publicationYear: 1839,
    category: "Science",
    price: 329.9,
    image: cover("#3d4f7c"),
  },
  {
    title: "The Descent of Man, and Selection in Relation to Sex",
    author: DARWIN,
    publicationYear: 1871,
    category: "Science",
    price: 379,
    image: cover("#8a6d2f"),
  },
  {
    title: "The Expression of the Emotions in Man and Animals",
    author: DARWIN,
    publicationYear: 1872,
    category: "Science",
    price: 319,
    image: cover("#5a3d6b"),
  },
  {
    title: "Divá Bára",
    author: NEMCOVA,
    publicationYear: 1856,
    category: "Fiction",
    price: 219,
    image: cover("#8b5e3c"),
  },
  {
    title: "Pohorská vesnice",
    author: NEMCOVA,
    publicationYear: 1856,
    category: "Fiction",
    price: 209.9,
    image: cover("#2f5d62"),
  },
  {
    title: "Trampoty pana Tenklase",
    author: HASEK,
    publicationYear: 1912,
    category: "Fiction",
    price: 189,
    image: cover("#7a2e3a"),
  },
  {
    title: "Dobrý voják Švejk v zajetí",
    author: HASEK,
    publicationYear: 1911,
    category: "Fiction",
    price: 269,
    image: cover("#3d4f7c"),
  },

  // The newest 12: the first catalogue page
  {
    title: "Osudy dobrého vojáka Švejka za světové války",
    author: HASEK,
    publicationYear: 1921,
    category: "Fiction",
    price: 399,
    image: cover("#5b6b3a"),
  },
  {
    title: "Zahradníkův rok",
    author: CAPEK,
    publicationYear: 1929,
    category: "Non-Fiction",
    price: 259,
    image: cover("#8a6d2f"),
  },
  {
    title: "Dášeňka čili Život štěněte",
    author: CAPEK,
    publicationYear: 1933,
    category: "Children",
    price: 189.5,
    image: cover("#5a3d6b"),
  },
  {
    title: "Bílá nemoc",
    author: CAPEK,
    publicationYear: 1937,
    category: "Fiction",
    price: 249,
  },
  {
    title: "Povídky z jedné kapsy",
    author: CAPEK,
    publicationYear: 1929,
    category: "Mystery",
    price: 229.9,
  },
  {
    title: "V zámku a v podzámčí",
    author: NEMCOVA,
    publicationYear: 1858,
    category: "Fiction",
    price: 239,
  },
  {
    title: "The Fatal Eggs",
    author: BULGAKOV,
    publicationYear: 1925,
    category: "Science Fiction",
    price: 199.9,
    image: cover("#8b5e3c"),
    inStock: false,
  },
  {
    title: "Heart of a Dog",
    author: BULGAKOV,
    publicationYear: 1968,
    category: "Fiction",
    price: 259,
    image: cover("#44505a"),
  },
  {
    title: "The White Guard",
    author: BULGAKOV,
    publicationYear: 1925,
    category: "Fiction",
    price: 339,
    image: cover("#2f5d62"),
  },
  // 96 characters, the most the card has to fit (a title is at most 100)
  {
    title:
      "The Formation of Vegetable Mould, through the Action of Worms, with Observations on Their Habits",
    author: DARWIN,
    publicationYear: 1881,
    category: "Science",
    price: 289,
    image: cover("#7a2e3a"),
  },
  {
    title: "Мастер и Маргарита",
    author: BULGAKOV,
    publicationYear: 1967,
    category: "Fantasy",
    price: 349.9,
    image: cover("#3d4f7c"),
  },
  {
    title: SMOKE_BOOK_TITLE,
    author: NEMCOVA,
    publicationYear: 1855,
    category: "Fiction",
    price: 299,
    image: cover("#5b6b3a"),
  },
];
