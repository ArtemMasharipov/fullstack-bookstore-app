/**
 * Order Repository Interface
 * Defines the contract for order data operations
 */
export class IOrderRepository {
  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }

  async findByUserId(userId) {
    throw new Error('Method findByUserId must be implemented')
  }

  async create(orderData) {
    throw new Error('Method create must be implemented')
  }

  async update(id, updateData) {
    throw new Error('Method update must be implemented')
  }

  async updateStatus(id, status) {
    throw new Error('Method updateStatus must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }
}
