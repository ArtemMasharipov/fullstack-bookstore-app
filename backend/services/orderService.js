/**
 * Order Service Layer
 * Contains business logic for order management
 */

import Cart from '../models/Cart.js'
import Order from '../models/Order.js'
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors.js'

/**
 * Create order from cart
 * @param {string} userId - User ID
 * @param {Object} orderData - Order data (shippingAddress, paymentMethod, notes)
 * @returns {Object} Created order
 */
export async function createOrder(userId, orderData) {
  const { shippingAddress, paymentMethod, notes } = orderData

  // Validate shipping address
  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.address ||
    !shippingAddress.city ||
    !shippingAddress.postalCode ||
    !shippingAddress.country
  ) {
    throw new ValidationError('Complete shipping address is required')
  }

  // Validate payment method
  const validPaymentMethods = ['card', 'paypal', 'cash_on_delivery']
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    throw new ValidationError(
      `Payment method must be one of: ${validPaymentMethods.join(', ')}`
    )
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: userId }).populate(
    'items.book',
    'title price inStock'
  )

  if (!cart || cart.items.length === 0) {
    throw new ValidationError('Cart is empty')
  }

  // Validate cart items
  const orderItems = []
  for (const item of cart.items) {
    const book = item.book

    if (!book) {
      throw new ValidationError('Some books in cart no longer exist')
    }

    if (!book.inStock) {
      throw new ValidationError(`Book "${book.title}" is out of stock`)
    }

    orderItems.push({
      book: book._id,
      title: book.title,
      quantity: item.quantity,
      price: book.price,
      subtotal: book.price * item.quantity,
    })
  }

  // Generate order number
  const orderNumber = await Order.generateOrderNumber()

  // Create order
  const order = new Order({
    orderNumber,
    user: userId,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    notes,
  })

  // Prices are calculated automatically by pre-save hook
  await order.save()

  // Clear user's cart
  cart.items = []
  await cart.save()

  // Populate order
  await order.populate('items.book', 'title author image category')

  return order
}

/**
 * Get user's orders
 * @param {string} userId - User ID
 * @param {Object} filters - Filter options (status, page, limit)
 * @returns {Object} { orders, pagination }
 */
export async function getUserOrders(userId, filters = {}) {
  const { status, page = 1, limit = 10 } = filters

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new ValidationError('Page and limit must be greater than 0')
  }

  if (limit > 50) {
    throw new ValidationError('Maximum limit is 50')
  }

  const query = { user: userId }
  if (status) {
    query.status = status
  }

  const skip = (page - 1) * limit

  // Execute queries in parallel
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.book', 'title author image')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ])

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

/**
 * Get order by ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Object} Order
 */
export async function getOrderById(orderId, userId) {
  const order = await Order.findById(orderId)
    .populate('items.book', 'title author image category price')
    .populate('user', 'username email')
    .lean()

  if (!order) {
    throw new NotFoundError('Order not found')
  }

  // Check if user owns this order (unless admin check is added later)
  if (order.user._id.toString() !== userId) {
    throw new ForbiddenError('You do not have access to this order')
  }

  return order
}

/**
 * Cancel order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {Object} Updated order
 */
export async function cancelOrder(orderId, userId) {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new NotFoundError('Order not found')
  }

  // Check ownership
  if (order.user.toString() !== userId) {
    throw new ForbiddenError('You do not have access to this order')
  }

  // Check if can be cancelled
  if (order.status === 'delivered') {
    throw new ValidationError('Cannot cancel delivered order')
  }

  if (order.status === 'cancelled') {
    throw new ValidationError('Order is already cancelled')
  }

  order.cancel()
  await order.save()

  await order.populate('items.book', 'title author image')

  return order
}

// =============================================================================
// ADMIN OPERATIONS
// =============================================================================

/**
 * Get all orders (admin)
 * @param {Object} filters - Filter options (status, isPaid, isDelivered, page, limit)
 * @returns {Object} { orders, pagination }
 */
export async function getAllOrders(filters = {}) {
  const { status, isPaid, isDelivered, page = 1, limit = 20 } = filters

  // Validate pagination
  if (page < 1 || limit < 1) {
    throw new ValidationError('Page and limit must be greater than 0')
  }

  if (limit > 100) {
    throw new ValidationError('Maximum limit is 100')
  }

  // Build query
  const query = {}
  if (status) query.status = status
  if (isPaid !== undefined) query.isPaid = isPaid === 'true'
  if (isDelivered !== undefined) query.isDelivered = isDelivered === 'true'

  const skip = (page - 1) * limit

  // Execute queries in parallel
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'username email')
      .populate('items.book', 'title')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ])

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  }
}

/**
 * Update order status (admin)
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Object} Updated order
 */
export async function updateOrderStatus(orderId, status) {
  const validStatuses = [
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ]

  if (!validStatuses.includes(status)) {
    throw new ValidationError(
      `Status must be one of: ${validStatuses.join(', ')}`
    )
  }

  const order = await Order.findById(orderId)

  if (!order) {
    throw new NotFoundError('Order not found')
  }

  // Cannot change status of cancelled order
  if (order.status === 'cancelled' && status !== 'cancelled') {
    throw new ValidationError('Cannot change status of cancelled order')
  }

  order.status = status

  // Auto-mark as delivered if status is delivered
  if (status === 'delivered') {
    order.markAsDelivered()
  }

  await order.save()

  await order.populate('items.book', 'title author image')
  await order.populate('user', 'username email')

  return order
}

/**
 * Mark order as paid (admin)
 * @param {string} orderId - Order ID
 * @returns {Object} Updated order
 */
export async function markOrderAsPaid(orderId) {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new NotFoundError('Order not found')
  }

  if (order.isPaid) {
    throw new ValidationError('Order is already marked as paid')
  }

  order.markAsPaid()
  await order.save()

  await order.populate('items.book', 'title author image')
  await order.populate('user', 'username email')

  return order
}

/**
 * Get order statistics (admin)
 * @returns {Object} Order statistics
 */
export async function getOrderStats() {
  const [total, byStatus, totalRevenue, paidOrders, deliveredOrders] =
    await Promise.all([
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ isPaid: true }),
      Order.countDocuments({ isDelivered: true }),
    ])

  const statusStats = {}
  byStatus.forEach(item => {
    statusStats[item._id] = item.count
  })

  return {
    total,
    byStatus: statusStats,
    totalRevenue: totalRevenue[0]?.total || 0,
    paidOrders,
    deliveredOrders,
    pendingOrders: statusStats.pending || 0,
  }
}
