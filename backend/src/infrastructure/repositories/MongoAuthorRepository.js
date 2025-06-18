import { Author as AuthorEntity } from '../../domain/entities/Author.js'
import { IAuthorRepository } from '../../domain/repositories/IAuthorRepository.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Author from '../schemas/AuthorSchema.js'

export class MongoAuthorRepository extends IAuthorRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(Author)
  }

  async findAll() {
    const authors = await this.crudManager.findAll()
    return authors.map(author => this._mapToEntity(author))
  }

  async findById(id) {
    const author = await this.crudManager.findById(id)
    return author ? this._mapToEntity(author) : null
  }

  async findWithBooks(id) {
    const author = await this.crudManager.findById(id, ['books'])
    return author ? this._mapToEntity(author) : null
  }

  async create(authorData) {
    const author = await this.crudManager.create(authorData)
    return this._mapToEntity(author)
  }

  async update(id, updateData) {
    const author = await this.crudManager.update(id, updateData)
    return author ? this._mapToEntity(author) : null
  }

  async delete(id) {
    const author = await this.crudManager.delete(id)
    return author ? this._mapToEntity(author) : null
  }

  async addBookToAuthor(authorId, bookId) {
    const author = await Author.findByIdAndUpdate(
      authorId,
      { $addToSet: { books: bookId } },
      { new: true }
    )
    return author ? this._mapToEntity(author) : null
  }

  async removeBookFromAuthor(authorId, bookId) {
    const author = await Author.findByIdAndUpdate(
      authorId,
      { $pull: { books: bookId } },
      { new: true }
    )
    return author ? this._mapToEntity(author) : null
  }

  _mapToEntity(mongoDoc) {
    return AuthorEntity.create({
      id: mongoDoc._id.toString(),
      name: mongoDoc.name,
      biography: mongoDoc.biography,
      books: mongoDoc.books || [],
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
