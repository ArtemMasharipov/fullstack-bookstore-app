/**
 * Test data factories
 * createAuthor() and createBook() save a valid document through the model;
 * overrides replace the default fields. createBook() creates an author unless
 * one is given.
 */

import Author from "../../models/Author.js";
import Book from "../../models/Book.js";
import Order from "../../models/Order.js";

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

/**
 * An order stored by the previous version of the app: float amounts in
 * crowns, the street in `address`, `isPaid` and a payment method, no
 * schemaVersion. Inserted directly, because the current model no longer
 * describes this shape. Returns the stored document.
 */
export async function createLegacyOrder(user, overrides = {}) {
  const book = (await createBook({ price: 12.99 }))._id;
  const { insertedId } = await Order.collection.insertOne({
    orderNumber: "ORD-20250101-0001",
    user: user._id,
    items: [{ book, title: "R.U.R.", quantity: 2, price: 12.99, subtotal: 25.98 }],
    shippingAddress: {
      fullName: "Jan Novák",
      address: "Vodičkova 12",
      city: "Praha",
      postalCode: "11000",
      country: "Czech Republic",
      phone: "777123456",
    },
    paymentMethod: "card",
    itemsPrice: 25.98,
    shippingPrice: 10,
    taxPrice: 2.6,
    totalPrice: 38.58,
    status: "pending",
    isPaid: false,
    isDelivered: false,
    createdAt: new Date("2025-01-01T10:00:00.000Z"),
    updatedAt: new Date("2025-01-01T10:00:00.000Z"),
    ...overrides,
  });
  return Order.collection.findOne({ _id: insertedId });
}
