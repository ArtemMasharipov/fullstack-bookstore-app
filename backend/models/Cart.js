/**
 * Cart Model
 * Schema for shopping cart with items
 */

import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [99, 'Quantity cannot exceed 99'],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false }
)

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      unique: true, // One cart per user
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
)

// Indexes
cartSchema.index({ user: 1, updatedAt: -1 })

// Virtual - check if cart is empty
cartSchema.virtual('isEmpty').get(function () {
  return this.items.length === 0
})

// Virtual - items count
cartSchema.virtual('itemsCount').get(function () {
  return this.items.length
})

// Method - calculate totals
cartSchema.methods.calculateTotals = function () {
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0)
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  // Round to 2 decimal places
  this.totalPrice = Math.round(this.totalPrice * 100) / 100
}

// Pre-save middleware - calculate totals before saving
cartSchema.pre('save', function (next) {
  this.calculateTotals()
  next()
})

// Static method - find cart by user
cartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate({
    path: 'items.book',
    select: 'title author price image inStock category',
  })
}

// Static method - create or get cart for user
cartSchema.statics.getOrCreate = async function (userId) {
  let cart = await this.findByUser(userId)

  if (!cart) {
    cart = await this.create({ user: userId, items: [] })
  }

  return cart
}

export default mongoose.model('Cart', cartSchema)
