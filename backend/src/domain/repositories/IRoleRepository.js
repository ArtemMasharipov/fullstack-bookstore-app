/**
 * Role Repository Interface
 * Defines the contract for role data operations
 */
export class IRoleRepository {
  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }

  async findByName(name) {
    throw new Error('Method findByName must be implemented')
  }

  async create(roleData) {
    throw new Error('Method create must be implemented')
  }

  async update(id, updateData) {
    throw new Error('Method update must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }

  async initializeDefaultRoles() {
    throw new Error('Method initializeDefaultRoles must be implemented')
  }
}
