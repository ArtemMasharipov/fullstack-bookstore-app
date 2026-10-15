/**
 * The order as the API shows it, built from a stored (lean) document.
 *
 * Orders stored before schemaVersion 2 had float amounts in crowns, the street
 * in `address`, an `isPaid` flag and a payment method. They are read as they
 * are: amounts are converted to geller once, nothing is recalculated, and the
 * stored document is never changed. Their tax was added on top of the price,
 * so their quote says vatIncluded: false.
 */

import { toMinorUnits } from "./pricing.js";

const isCurrent = (doc) => doc.schemaVersion === 2;

export function paymentStatusOf(doc) {
  if (doc.paymentStatus) return doc.paymentStatus;
  return doc.isPaid ? "paid" : "unpaid";
}

function itemsOf(doc) {
  return doc.items.map((item) => ({
    bookId: item.book.toString(),
    title: item.title,
    unitPrice: isCurrent(doc) ? item.unitPrice : toMinorUnits(item.price),
    quantity: item.quantity,
    lineTotal: isCurrent(doc) ? item.lineTotal : toMinorUnits(item.subtotal),
  }));
}

function addressOf(doc) {
  const address = doc.shippingAddress;
  return {
    fullName: address.fullName,
    line1: isCurrent(doc) ? address.line1 : address.address,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone ?? null,
  };
}

function quoteOf(doc) {
  if (isCurrent(doc)) {
    const { currency, itemsTotal, shipping, vatIncluded, vatAmount, total } = doc.quote;
    return { currency, itemsTotal, shipping, vatIncluded, vatAmount, total };
  }
  return {
    currency: "CZK",
    itemsTotal: toMinorUnits(doc.itemsPrice),
    shipping: toMinorUnits(doc.shippingPrice),
    vatIncluded: false,
    vatAmount: toMinorUnits(doc.taxPrice),
    total: toMinorUnits(doc.totalPrice),
  };
}

const historyOf = (doc) =>
  (doc.statusHistory ?? []).map(({ axis, from, to, by, at }) => ({ axis, from, to, by, at }));

export function toOrderView(doc) {
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    status: doc.status,
    paymentStatus: paymentStatusOf(doc),
    items: itemsOf(doc),
    shippingAddress: addressOf(doc),
    quote: quoteOf(doc),
    statusHistory: historyOf(doc),
    createdAt: doc.createdAt,
  };
}

export function toOrderSummary(doc) {
  const { total, currency } = quoteOf(doc);
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    createdAt: doc.createdAt,
    status: doc.status,
    paymentStatus: paymentStatusOf(doc),
    total,
    currency,
    itemCount: doc.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
