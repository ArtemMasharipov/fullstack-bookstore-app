/**
 * User Repository Interface
 * Defines the contract for user data operations
 */
export class IUserRepository {
  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }
  async findByEmail(email) {
    throw new Error('Method findByEmail must be implemented')
  }

  async findByUsername(username) {
    throw new Error('Method findByUsername must be implemented')
  }

  async create(userData) {
    throw new Error('Method create must be implemented')
  }

  async update(id, updateData) {
    throw new Error('Method update must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }

  async findWithRole(id) {
    throw new Error('Method findWithRole must be implemented')
  }
}
