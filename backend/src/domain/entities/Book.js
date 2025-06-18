export class Book {
  constructor({
    id,
    title,
    author,
    publicationYear,
    category,
    description,
    price,
    image,
    inStock = true,
    createdAt,
    updatedAt,
  }) {
    this.id = id
    this.title = title
    this.author = author
    this.publicationYear = publicationYear
    this.category = category
    this.description = description
    this.price = price
    this.image = image
    this.inStock = inStock
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static create(data) {
    return new Book(data)
  }

  update(data) {
    Object.assign(this, { ...data, updatedAt: new Date() })
    return this
  }

  isAvailable() {
    return this.inStock
  }

  validatePrice() {
    return this.price >= 0 && this.price <= 999999.99
  }
}
