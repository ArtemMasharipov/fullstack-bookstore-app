/**
 * Domain Service for Order Business Logic
 */
export class OrderDomainService {
  static validateOrderCreation(cartItems, shippingAddress) {
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Cart cannot be empty when creating an order')
    }

    if (!shippingAddress) {
      throw new Error('Shipping address is required')
    }

    this.validateShippingAddress(shippingAddress)
    return true
  }

  static validateShippingAddress(address) {
    const requiredFields = ['street', 'city', 'country']

    for (const field of requiredFields) {
      if (!address[field] || address[field].trim() === '') {
        throw new Error(`${field} is required in shipping address`)
      }
    }

    return true
  }

  static calculateOrderTotal(items) {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  static validateStatusTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    }

    const allowedStatuses = validTransitions[currentStatus] || []

    if (!allowedStatuses.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`)
    }

    return true
  }

  static canBeCancelled(status) {
    return ['pending', 'processing'].includes(status)
  }
}
