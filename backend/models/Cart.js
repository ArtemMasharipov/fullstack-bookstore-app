/**
 * Cart Model
 * A cart stores which books a user wants and how many. Prices and totals are
 * never stored: the cart service reads them from the books on every request.
 */

import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.index({ user: 1, updatedAt: -1 });

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
