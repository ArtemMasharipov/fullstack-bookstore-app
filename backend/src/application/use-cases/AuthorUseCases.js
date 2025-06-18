export class CreateAuthorUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute(authorData) {
    return await this.authorRepository.create(authorData)
  }
}

export class GetAllAuthorsUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute() {
    return await this.authorRepository.findAll()
  }
}

export class GetAuthorByIdUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute(id) {
    const author = await this.authorRepository.findById(id)
    if (!author) {
      throw new Error('Author not found')
    }
    return author
  }
}

export class GetAuthorWithBooksUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute(id) {
    const author = await this.authorRepository.findWithBooks(id)
    if (!author) {
      throw new Error('Author not found')
    }
    return author
  }
}

export class UpdateAuthorUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute(id, updateData) {
    const author = await this.authorRepository.update(id, updateData)
    if (!author) {
      throw new Error('Author not found')
    }
    return author
  }
}

export class DeleteAuthorUseCase {
  constructor(authorRepository) {
    this.authorRepository = authorRepository
  }

  async execute(id) {
    const author = await this.authorRepository.delete(id)
    if (!author) {
      throw new Error('Author not found')
    }
    return author
  }
}
