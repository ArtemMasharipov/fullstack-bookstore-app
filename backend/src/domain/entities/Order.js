export class Order {
  constructor({
    id,
    userId,
    items = [],
    totalPrice = 0,
    status = 'pending',
    shippingAddress,
    createdAt,
    updatedAt,
  }) {
    this.id = id
    this.userId = userId
    this.items = items
    this.totalPrice = totalPrice
    this.status = status
    this.shippingAddress = shippingAddress
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new Order(data)
  }

  updateStatus(newStatus) {
    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ]
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus
      this.updatedAt = new Date()
    }
    return this
  }

  cancel() {
    if (this.status === 'pending' || this.status === 'processing') {
      this.status = 'cancelled'
      this.updatedAt = new Date()
    }
    return this
  }

  isPending() {
    return this.status === 'pending'
  }

  isCompleted() {
    return this.status === 'delivered'
  }

  isCancelled() {
    return this.status === 'cancelled'
  }
}
