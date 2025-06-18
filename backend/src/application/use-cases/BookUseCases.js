export class CreateBookUseCase {
  constructor(bookRepository, authorRepository) {
    this.bookRepository = bookRepository
    this.authorRepository = authorRepository
  }

  async execute(bookData) {

    const author = await this.authorRepository.findById(bookData.authorId)
    if (!author) {
      throw new Error('Author not found')
    }


    const book = await this.bookRepository.create({
      ...bookData,
      author: bookData.authorId,
    })

    return book
  }
}

export class GetAllBooksUseCase {
  constructor(bookRepository) {
    this.bookRepository = bookRepository
  }

  async execute(filters = {}) {
    return await this.bookRepository.findAll(filters)
  }
}

export class GetBookByIdUseCase {
  constructor(bookRepository) {
    this.bookRepository = bookRepository
  }

  async execute(id) {
    const book = await this.bookRepository.findById(id)
    if (!book) {
      throw new Error('Book not found')
    }
    return book
  }
}

export class UpdateBookUseCase {
  constructor(bookRepository, authorRepository) {
    this.bookRepository = bookRepository
    this.authorRepository = authorRepository
  }

  async execute(id, updateData) {
    // If authorId is being updated, validate new author
    if (updateData.authorId) {
      const author = await this.authorRepository.findById(updateData.authorId)
      if (!author) {
        throw new Error('Author not found')
      }
      updateData.author = updateData.authorId
      delete updateData.authorId
    }

    const book = await this.bookRepository.update(id, updateData)
    if (!book) {
      throw new Error('Book not found')
    }
    return book
  }
}

export class DeleteBookUseCase {
  constructor(bookRepository) {
    this.bookRepository = bookRepository
  }

  async execute(id) {
    const book = await this.bookRepository.delete(id)
    if (!book) {
      throw new Error('Book not found')
    }
    return book
  }
}
