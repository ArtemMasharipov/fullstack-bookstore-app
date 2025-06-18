/**
 * Author Repository Interface
 * Defines the contract for author data operations
 */
export class IAuthorRepository {
  async findAll() {
    throw new Error('Method findAll must be implemented')
  }

  async findById(id) {
    throw new Error('Method findById must be implemented')
  }

  async findWithBooks(id) {
    throw new Error('Method findWithBooks must be implemented')
  }

  async create(authorData) {
    throw new Error('Method create must be implemented')
  }

  async update(id, updateData) {
    throw new Error('Method update must be implemented')
  }

  async delete(id) {
    throw new Error('Method delete must be implemented')
  }

  async addBookToAuthor(authorId, bookId) {
    throw new Error('Method addBookToAuthor must be implemented')
  }

  async removeBookFromAuthor(authorId, bookId) {
    throw new Error('Method removeBookFromAuthor must be implemented')
  }
}
