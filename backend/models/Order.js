/**
 * Order Model
 * Schema for customer orders
 */

import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book is required']
  },
  title: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  postalCode: {
    type: String,
    required: [true, 'Postal code is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    index: true
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: [true, 'Shipping address is required']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['card', 'paypal', 'cash_on_delivery'],
    default: 'card'
  },
  itemsPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  taxPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true
  },
  isPaid: {
    type: Boolean,
    default: false,
    index: true
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false,
    index: true
  },
  deliveredAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ isPaid: 1, isDelivered: 1 });

// Virtual - total items count
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Static method - generate order number
orderSchema.statics.generateOrderNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Count orders today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const count = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  
  return `ORD-${year}${month}${day}-${sequence}`;
};

// Static method - find orders by user
orderSchema.statics.findByUser = function(userId, filters = {}) {
  const query = { user: userId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  return this.find(query)
    .populate('items.book', 'title author image')
    .sort('-createdAt');
};

// Instance method - calculate totals
orderSchema.methods.calculatePrices = function() {
  // Calculate items price
  this.itemsPrice = this.items.reduce((sum, item) => {
    item.subtotal = item.price * item.quantity;
    return sum + item.subtotal;
  }, 0);
  
  // Calculate shipping (free shipping over $50)
  this.shippingPrice = this.itemsPrice >= 50 ? 0 : 10;
  
  // Calculate tax (10%)
  this.taxPrice = Math.round(this.itemsPrice * 0.1 * 100) / 100;
  
  // Calculate total
  this.totalPrice = this.itemsPrice + this.shippingPrice + this.taxPrice;
  
  // Round to 2 decimal places
  this.itemsPrice = Math.round(this.itemsPrice * 100) / 100;
  this.totalPrice = Math.round(this.totalPrice * 100) / 100;
};

// Instance method - mark as paid
orderSchema.methods.markAsPaid = function() {
  this.isPaid = true;
  this.paidAt = new Date();
  if (this.status === 'pending') {
    this.status = 'processing';
  }
};

// Instance method - mark as delivered
orderSchema.methods.markAsDelivered = function() {
  this.isDelivered = true;
  this.deliveredAt = new Date();
  this.status = 'delivered';
};

// Instance method - cancel order
orderSchema.methods.cancel = function() {
  if (this.status === 'delivered') {
    throw new Error('Cannot cancel delivered order');
  }
  this.status = 'cancelled';
  this.cancelledAt = new Date();
};

// Pre-save middleware - calculate prices
orderSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('items')) {
    this.calculatePrices();
  }
  next();
});

export default mongoose.model('Order', orderSchema);
