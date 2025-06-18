/**
 * Domain Service for Cart Business Logic
 */
export class CartDomainService {
  static calculateTotalPrice(items) {
    return items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  }

  static validateCartItem(bookId, quantity, price) {
    if (!bookId) {
      throw new Error('Book ID is required')
    }
    if (!quantity || quantity < 1 || quantity > 99) {
      throw new Error('Quantity must be between 1 and 99')
    }
    if (!price || price < 0) {
      throw new Error('Price must be greater than 0')
    }
    return true
  }

  static mergeCartItems(existingItems, newItems) {
    const itemMap = new Map()

    // Add existing items to map
    existingItems.forEach(item => {
      itemMap.set(item.bookId.toString(), item)
    })

    // Merge new items
    newItems.forEach(newItem => {
      const key = newItem.bookId.toString()
      if (itemMap.has(key)) {
        const existing = itemMap.get(key)
        existing.quantity += newItem.quantity
      } else {
        itemMap.set(key, newItem)
      }
    })

    return Array.from(itemMap.values())
  }

  static validateCartSync(items) {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array')
    }

    items.forEach(item => {
      this.validateCartItem(item.bookId, item.quantity, item.price)
    })

    return true
  }
}
