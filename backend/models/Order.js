/**
 * Order Model
 * A customer order, schemaVersion 2: amounts in geller (1/100 CZK), the
 * prices and the quote the customer ordered at, and a history of status and
 * payment changes. Orders stored before version 2 stay as they are and are
 * read through services/orderView.js; nothing here requires their fields.
 */

import mongoose from "mongoose";

const amount = { type: Number, required: true, min: 0, validate: Number.isInteger };

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    title: { type: String, required: true },
    unitPrice: amount,
    quantity: { type: Number, required: true, min: 1, max: 99, validate: Number.isInteger },
    lineTotal: amount,
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

const quoteSchema = new mongoose.Schema(
  {
    currency: { type: String, required: true },
    itemsTotal: amount,
    shipping: amount,
    vatIncluded: { type: Boolean, required: true },
    vatAmount: amount,
    total: amount,
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    axis: { type: String, required: true, enum: ["status", "payment"] },
    from: { type: String, default: null },
    to: { type: String, required: true },
    by: { type: String, required: true, enum: ["user", "admin"] },
    at: { type: Date, required: true },
  },
  { _id: false }
);

export const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
export const PAYMENT_STATUSES = ["unpaid", "paid", "failed"];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: "Order must have at least one item" },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },
    quote: { type: quoteSchema, required: true },
    status: { type: String, required: true, enum: ORDER_STATUSES, default: "pending" },
    paymentStatus: { type: String, required: true, enum: PAYMENT_STATUSES, default: "unpaid" },
    statusHistory: { type: [historyEntrySchema], default: [] },
    idempotencyKey: { type: String },
    requestHash: { type: String },
    schemaVersion: { type: Number, required: true, default: 2 },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
// One order per key and user; older orders have no key and are left out
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } }
);

export default mongoose.model("Order", orderSchema);
