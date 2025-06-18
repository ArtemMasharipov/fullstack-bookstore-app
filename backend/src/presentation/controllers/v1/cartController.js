import { validationResult } from 'express-validator'
import {
  AddToCartUseCase,
  GetCartUseCase,
  RemoveFromCartUseCase,
  SyncCartUseCase,
  UpdateCartItemUseCase,
} from '../../../application/use-cases/CartUseCases.js'
import { MongoBookRepository } from '../../../infrastructure/repositories/MongoBookRepository.js'
import { MongoCartRepository } from '../../../infrastructure/repositories/MongoCartRepository.js'

const cartRepository = new MongoCartRepository()
const bookRepository = new MongoBookRepository()

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

export const getCart = async (req, res) => {
  try {
    const getCartUseCase = new GetCartUseCase(cartRepository)
    const cart = await getCartUseCase.execute(req.user.id)
    res.json(cart)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const addToCart = async (req, res) => {
  try {
    if (!validateRequest(req, res)) return

    const addToCartUseCase = new AddToCartUseCase(
      cartRepository,
      bookRepository
    )
    const { bookId, quantity } = req.body
    const cart = await addToCartUseCase.execute(req.user.id, bookId, quantity)
    res.json(cart)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const updateCartItem = async (req, res) => {
  try {
    const updateCartItemUseCase = new UpdateCartItemUseCase(cartRepository)
    const { quantity } = req.body
    const cart = await updateCartItemUseCase.execute(
      req.user.id,
      req.params.id,
      quantity
    )
    res.json(cart)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const removeCartItem = async (req, res) => {
  try {
    const removeFromCartUseCase = new RemoveFromCartUseCase(cartRepository)
    const cart = await removeFromCartUseCase.execute(req.user.id, req.params.id)
    res.json(cart)
  } catch (error) {
    handleErrors(res, error)
  }
}

export const syncCart = async (req, res) => {
  try {
    const syncCartUseCase = new SyncCartUseCase(cartRepository, bookRepository)
    const { items } = req.body
    const cart = await syncCartUseCase.execute(req.user.id, items)
    res.json(cart)
  } catch (error) {
    handleErrors(res, error)
  }
}
