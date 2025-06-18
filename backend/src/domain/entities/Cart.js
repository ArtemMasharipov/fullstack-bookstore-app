export class Cart {
  constructor({
    id,
    userId,
    items = [],
    totalPrice = 0,
    createdAt,
    updatedAt,
  }) {
    this.id = id
    this.userId = userId
    this.items = items
    this.totalPrice = totalPrice
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new Cart(data)
  }

  addItem(bookId, quantity, price) {
    const existingItem = this.items.find(item => item.bookId === bookId)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      this.items.push({ bookId, quantity, price })
    }

    this.calculateTotalPrice()
    return this
  }

  removeItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId)
    this.calculateTotalPrice()
    return this
  }

  updateItemQuantity(itemId, quantity) {
    const item = this.items.find(item => item.id === itemId)
    if (item) {
      item.quantity = quantity
      this.calculateTotalPrice()
    }
    return this
  }

  calculateTotalPrice() {
    this.totalPrice = this.items.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
    return this.totalPrice
  }

  clear() {
    this.items = []
    this.totalPrice = 0
    return this
  }

  isEmpty() {
    return this.items.length === 0
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0)
  }
}
