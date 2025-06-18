import { Book as BookEntity } from '../../domain/entities/Book.js'
import { IBookRepository } from '../../domain/repositories/IBookRepository.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Book from '../schemas/BookSchema.js'

export class MongoBookRepository extends IBookRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(Book)
  }

  async findAll(filters = {}) {
    const books = await this.crudManager.findAll(filters, ['author'])
    return books.map(book => this._mapToEntity(book))
  }

  async findById(id) {
    const book = await this.crudManager.findById(id, ['author'])
    return book ? this._mapToEntity(book) : null
  }

  async create(bookData) {
    const book = await this.crudManager.create(bookData)
    return this._mapToEntity(book)
  }

  async update(id, updateData) {
    const book = await this.crudManager.update(id, updateData)
    return book ? this._mapToEntity(book) : null
  }

  async delete(id) {
    const book = await this.crudManager.delete(id)
    return book ? this._mapToEntity(book) : null
  }

  async findByAuthor(authorId) {
    const books = await this.crudManager.findAll({ author: authorId }, [
      'author',
    ])
    return books.map(book => this._mapToEntity(book))
  }

  async findByCategory(category) {
    const books = await this.crudManager.findAll(
      { category: new RegExp(category, 'i') },
      ['author']
    )
    return books.map(book => this._mapToEntity(book))
  }

  async search(query) {
    const searchCriteria = {
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') },
      ],
    }
    const books = await this.crudManager.findAll(searchCriteria, ['author'])
    return books.map(book => this._mapToEntity(book))
  }

  _mapToEntity(mongoDoc) {
    return BookEntity.create({
      id: mongoDoc._id.toString(),
      title: mongoDoc.title,
      author: mongoDoc.author,
      publicationYear: mongoDoc.publicationYear,
      category: mongoDoc.category,
      description: mongoDoc.description,
      price: mongoDoc.price,
      image: mongoDoc.image,
      inStock: mongoDoc.inStock,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
