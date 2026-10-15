import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { paymentStatusOf, toOrderSummary, toOrderView } from "../../services/orderView.js";

const id = () => new mongoose.Types.ObjectId();
const createdAt = new Date("2026-10-15T10:00:00.000Z");

const CONTRACT_KEYS = [
  "createdAt",
  "id",
  "items",
  "orderNumber",
  "paymentStatus",
  "quote",
  "shippingAddress",
  "status",
  "statusHistory",
].sort();

function currentOrder(overrides = {}) {
  return {
    _id: id(),
    __v: 0,
    schemaVersion: 2,
    orderNumber: "ORD-20261015-000001",
    user: id(),
    items: [
      { book: id(), title: "R.U.R.", unitPrice: 19900, quantity: 2, lineTotal: 39800 },
      { book: id(), title: "Krakatit", unitPrice: 24900, quantity: 3, lineTotal: 74700 },
    ],
    shippingAddress: {
      fullName: "Jan Novák",
      line1: "Vodičkova 12",
      city: "Praha",
      postalCode: "110 00",
      country: "CZ",
      phone: "+420 777 123 456",
    },
    quote: {
      currency: "CZK",
      itemsTotal: 114500,
      shipping: 0,
      vatIncluded: true,
      vatAmount: 0,
      total: 114500,
    },
    status: "pending",
    paymentStatus: "unpaid",
    statusHistory: [{ axis: "status", from: null, to: "pending", by: "user", at: createdAt }],
    idempotencyKey: "4b7c1c1e-6a5f-4a43-9a51-0d2f7f3b8f10",
    requestHash: "abc",
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

function legacyOrder(overrides = {}) {
  return {
    _id: id(),
    orderNumber: "ORD-20250101-0001",
    user: id(),
    items: [{ book: id(), title: "R.U.R.", quantity: 2, price: 12.99, subtotal: 25.98 }],
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
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  };
}

describe("toOrderView", () => {
  it("a current order is shown by the contract", () => {
    const doc = currentOrder();
    const view = toOrderView(doc);

    expect(Object.keys(view).sort()).toEqual(CONTRACT_KEYS);
    expect(view.id).toBe(doc._id.toString());
    expect(view.items[0]).toEqual({
      bookId: doc.items[0].book.toString(),
      title: "R.U.R.",
      unitPrice: 19900,
      quantity: 2,
      lineTotal: 39800,
    });
    expect(view.shippingAddress).toEqual(doc.shippingAddress);
    expect(view.quote).toEqual(doc.quote);
    expect(view.statusHistory).toEqual([
      { axis: "status", from: null, to: "pending", by: "user", at: createdAt },
    ]);
    expect(view).toMatchObject({ status: "pending", paymentStatus: "unpaid", createdAt });
  });

  it("an order of the previous shape keeps its amounts in geller", () => {
    const doc = legacyOrder();
    const view = toOrderView(doc);

    expect(Object.keys(view).sort()).toEqual(CONTRACT_KEYS);
    expect(view.items).toEqual([
      {
        bookId: doc.items[0].book.toString(),
        title: "R.U.R.",
        unitPrice: 1299,
        quantity: 2,
        lineTotal: 2598,
      },
    ]);
    expect(view.quote).toEqual({
      currency: "CZK",
      itemsTotal: 2598,
      shipping: 1000,
      vatIncluded: false,
      vatAmount: 260,
      total: 3858,
    });
    expect(view.shippingAddress).toEqual({
      fullName: "Jan Novák",
      line1: "Vodičkova 12",
      city: "Praha",
      postalCode: "11000",
      country: "Czech Republic",
      phone: "777123456",
    });
    expect(view.paymentStatus).toBe("unpaid");
    expect(view.statusHistory).toEqual([]);
    expect(view.orderNumber).toBe("ORD-20250101-0001");
  });

  it("an older order without a phone shows phone as null", () => {
    const doc = legacyOrder();
    delete doc.shippingAddress.phone;

    expect(toOrderView(doc).shippingAddress.phone).toBeNull();
  });

  it("keeps the history an older order gained later", () => {
    const entry = { axis: "status", from: "pending", to: "cancelled", by: "user", at: createdAt };

    expect(toOrderView(legacyOrder({ statusHistory: [entry] })).statusHistory).toEqual([entry]);
  });
});

describe("paymentStatusOf", () => {
  it.each([
    ["a current unpaid order", currentOrder(), "unpaid"],
    ["a current failed payment", currentOrder({ paymentStatus: "failed" }), "failed"],
    ["an older unpaid order", legacyOrder(), "unpaid"],
    ["an older paid order", legacyOrder({ isPaid: true }), "paid"],
    ["an older order paid later by an admin", legacyOrder({ paymentStatus: "paid" }), "paid"],
  ])("%s", (_, doc, expected) => {
    expect(paymentStatusOf(doc)).toBe(expected);
  });
});

describe("toOrderSummary", () => {
  it("lists the total, the currency and the number of books", () => {
    const doc = currentOrder();

    expect(toOrderSummary(doc)).toEqual({
      id: doc._id.toString(),
      orderNumber: "ORD-20261015-000001",
      createdAt,
      status: "pending",
      paymentStatus: "unpaid",
      total: 114500,
      currency: "CZK",
      itemCount: 5,
    });
  });

  it("lists an older order in geller", () => {
    expect(toOrderSummary(legacyOrder())).toMatchObject({
      total: 3858,
      currency: "CZK",
      itemCount: 2,
      paymentStatus: "unpaid",
    });
  });
});
