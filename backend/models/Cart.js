/**
 * Cart Model
 * Schema for shopping cart with items
 */

import mongoose from "mongoose";

/** Reusable populate config for book references */
const POPULATE_BOOKS = {
  path: "items.book",
  select: "title author price image inStock category",
};

const cartItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      max: [99, "Quantity cannot exceed 99"],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.index({ user: 1, updatedAt: -1 });

// Pre-save — recalculate totals
cartSchema.pre("save", function (next) {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = Math.round(
    this.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100
  ) / 100;
  next();
});

/**
 * Find cart with populated books (for reading/returning to client)
 */
cartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate(POPULATE_BOOKS);
};

/**
 * Get or create cart WITHOUT populate (for write operations).
 * items.book stays as raw ObjectId so .toString() comparisons work.
 */
cartSchema.statics.getOrCreate = async function (userId) {
  try {
    return await this.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { upsert: true, new: true }
    );
  } catch (err) {
    if (err.code === 11000) {
      return this.findOne({ user: userId });
    }
    throw err;
  }
};

/**
 * Populate config getter — used by services after save
 */
cartSchema.statics.POPULATE_BOOKS = POPULATE_BOOKS;

// Clean up stale indexes from old schema versions
cartSchema.statics.cleanupIndexes = async function () {
  try {
    const indexes = await this.collection.indexes();
    for (const idx of indexes) {
      if (idx.key.userId !== undefined && idx.name !== "_id_") {
        console.log(`Dropping stale index: ${idx.name}`);
        await this.collection.dropIndex(idx.name);
      }
    }
  } catch {
    // Best-effort
  }
};

const Cart = mongoose.model("Cart", cartSchema);

Cart.cleanupIndexes();

export default Cart;
