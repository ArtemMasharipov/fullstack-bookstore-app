import { validationResult } from 'express-validator'
import {
  CreateAuthorUseCase,
  DeleteAuthorUseCase,
  GetAllAuthorsUseCase,
  GetAuthorWithBooksUseCase,
  UpdateAuthorUseCase,
} from '../../../application/use-cases/AuthorUseCases.js'
import { MongoAuthorRepository } from '../../../infrastructure/repositories/MongoAuthorRepository.js'

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

export const getAllAuthors = async (req, res) => {
  try {
    const getAllAuthorsUseCase = new GetAllAuthorsUseCase(authorRepository)
    const authors = await getAllAuthorsUseCase.execute()
    res.json(authors)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const getAuthorWithBooks = async (req, res) => {
  try {
    const getAuthorWithBooksUseCase = new GetAuthorWithBooksUseCase(
      authorRepository
    )
    const author = await getAuthorWithBooksUseCase.execute(req.params.id)
    res.json(author)
  } catch (error) {
    handleErrors(res, error, 404)
  }
}

export const createAuthor = async (req, res) => {
  try {
    if (!validateRequest(req, res)) return

    const createAuthorUseCase = new CreateAuthorUseCase(authorRepository)
    const author = await createAuthorUseCase.execute(req.body)
    res.status(201).json(author)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const updateAuthor = async (req, res) => {
  try {
    if (!validateRequest(req, res)) return

    const updateAuthorUseCase = new UpdateAuthorUseCase(authorRepository)
    const author = await updateAuthorUseCase.execute(req.params.id, req.body)
    res.json(author)
  } catch (error) {
    handleErrors(res, error, 404)
  }
}

export const deleteAuthor = async (req, res) => {
  try {
    const deleteAuthorUseCase = new DeleteAuthorUseCase(authorRepository)
    await deleteAuthorUseCase.execute(req.params.id)
    res.status(204).send()
  } catch (error) {
    handleErrors(res, error, 404)
  }
}
