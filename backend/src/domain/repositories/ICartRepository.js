/**
 * Cart Repository Interface
 * Defines the contract for cart data operations
 */
export class ICartRepository {
  async findByUserId(userId) {
    throw new Error('Method findByUserId must be implemented')
  }

  async create(cartData) {
    throw new Error('Method create must be implemented')
  }

  async update(userId, cartData) {
    throw new Error('Method update must be implemented')
  }

  async addItem(userId, bookId, quantity, price) {
    throw new Error('Method addItem must be implemented')
  }

  async removeItem(userId, itemId) {
    throw new Error('Method removeItem must be implemented')
  }

  async updateItemQuantity(userId, itemId, quantity) {
    throw new Error('Method updateItemQuantity must be implemented')
  }

  async clear(userId) {
    throw new Error('Method clear must be implemented')
  }

  async syncCart(userId, items) {
    throw new Error('Method syncCart must be implemented')
  }
}
