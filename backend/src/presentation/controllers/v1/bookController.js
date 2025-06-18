import { validationResult } from 'express-validator'
import {
  CreateBookUseCase,
  DeleteBookUseCase,
  GetAllBooksUseCase,
  GetBookByIdUseCase,
  UpdateBookUseCase,
} from '../../../application/use-cases/BookUseCases.js'
import { MongoAuthorRepository } from '../../../infrastructure/repositories/MongoAuthorRepository.js'
import { MongoBookRepository } from '../../../infrastructure/repositories/MongoBookRepository.js'

const bookRepository = new MongoBookRepository()
const authorRepository = new MongoAuthorRepository()

const handleErrors = (res, error, status = 500) => {
  res.status(status).json({ error: error.message || error })
}

const validateRequest = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return false
  }
  return true
}

export const getAllBooks = async (req, res) => {
  try {
    const getAllBooksUseCase = new GetAllBooksUseCase(bookRepository)
    const books = await getAllBooksUseCase.execute()
    res.json(books)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const getBookById = async (req, res) => {
  try {
    const getBookByIdUseCase = new GetBookByIdUseCase(bookRepository)
    const book = await getBookByIdUseCase.execute(req.params.id)
    res.json(book)
  } catch (error) {
    handleErrors(res, error, 404)
  }
}

export const createBook = async (req, res) => {
  try {
    if (!validateRequest(req, res)) return

    const createBookUseCase = new CreateBookUseCase(
      bookRepository,
      authorRepository
    )
    const bookData = {
      ...req.body,
      image: req.file ? req.file.path : null,
    }

    const book = await createBookUseCase.execute(bookData)
    res.status(201).json(book)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const updateBook = async (req, res) => {
  try {
    if (!validateRequest(req, res)) return

    const updateBookUseCase = new UpdateBookUseCase(
      bookRepository,
      authorRepository
    )
    const updateData = {
      ...req.body,
      ...(req.file && { image: req.file.path }),
    }

    const book = await updateBookUseCase.execute(req.params.id, updateData)
    res.json(book)
  } catch (error) {
    handleErrors(res, error, 404)
  }
}

export const deleteBook = async (req, res) => {
  try {
    const deleteBookUseCase = new DeleteBookUseCase(bookRepository)
    await deleteBookUseCase.execute(req.params.id)
    res.status(204).send()
  } catch (error) {
    handleErrors(res, error, 404)
  }
}
