export class Author {
  constructor({ id, name, biography, books = [], createdAt, updatedAt }) {
    this.id = id
    this.name = name
    this.biography = biography
    this.books = books
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new Author(data)
  }

  update(data) {
    Object.assign(this, { ...data, updatedAt: new Date() })
    return this
  }

  addBook(bookId) {
    if (!this.books.includes(bookId)) {
      this.books.push(bookId)
    }
    return this
  }

  removeBook(bookId) {
    this.books = this.books.filter(id => id !== bookId)
    return this
  }

  getBookCount() {
    return this.books.length
  }
}
