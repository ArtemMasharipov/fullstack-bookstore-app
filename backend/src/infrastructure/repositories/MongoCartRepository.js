import mongoose from 'mongoose'
import { Cart as CartEntity } from '../../domain/entities/Cart.js'
import { ICartRepository } from '../../domain/repositories/ICartRepository.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Book from '../schemas/BookSchema.js'
import Cart from '../schemas/CartSchema.js'

export class MongoCartRepository extends ICartRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(Cart)
  }

  async findByUserId(userId) {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { items: [], totalPrice: 0 } },
      {
        new: true,
        upsert: true,
        populate: 'items.bookId',
      }
    )
    return cart ? this._mapToEntity(cart) : null
  }

  async create(cartData) {
    const cart = await this.crudManager.create(cartData)
    return this._mapToEntity(cart)
  }

  async update(userId, cartData) {
    const cart = await Cart.findOneAndUpdate({ userId }, cartData, {
      new: true,
    }).populate('items.bookId')
    return cart ? this._mapToEntity(cart) : null
  }
  async addItem(userId, bookId, quantity, price) {
    let cart = await Cart.findOne({
      userId,
      'items.bookId': bookId,
    })

    if (cart) {
      cart = await Cart.findOneAndUpdate(
        {
          userId,
          'items.bookId': bookId,
        },
        {
          $inc: { 'items.$.quantity': quantity },
          $set: { 'items.$.price': price },
        },
        { new: true }
      )
    } else {
      cart = await Cart.findOne({ userId })

      if (cart) {
        const book = await Book.findById(bookId)
        if (!book) {
          throw new Error('Book not found')
        }

        cart.items.push({
          bookId: book._id,
          quantity: quantity,
          price: book.price,
        })

        await cart.save()
      } else {
        cart = await this._createCartWithItem(userId, bookId, quantity)
      }
    }

    return cart.populate('items.bookId')
  }

  async removeItem(userId, itemId) {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
      { new: true }
    ).populate('items.bookId')

    if (!cart) {
      throw new Error('Cart not found')
    }

    await cart.save()
    return this._mapToEntity(cart)
  }

  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await Cart.findOneAndUpdate(
      { userId, 'items._id': itemId },
      { $set: { 'items.$.quantity': quantity } },
      { new: true }
    ).populate('items.bookId')

    if (!cart) {
      throw new Error('Cart or item not found')
    }

    return this._mapToEntity(cart)
  }

  async clear(userId) {
    const cart = await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0 },
      { new: true }
    )
    return cart ? this._mapToEntity(cart) : null
  }
  async syncCart(userId, items) {
    const validatedItems = []

    for (const item of items) {
      const book = await Book.findById(item.bookId)
      if (book) {
        validatedItems.push({
          bookId: item.bookId,
          quantity: item.quantity,
          price: book.price,
        })
      }
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      {
        items: validatedItems,
        $setOnInsert: { userId },
      },
      {
        new: true,
        upsert: true,
      }
    ).populate('items.bookId')

    return this._mapToEntity(cart)
  }

  async _createCartWithItem(userId, bookId, quantity) {
    const book = await Book.findById(bookId)
    if (!book) {
      throw new Error('Book not found')
    }

    const newCart = await Cart.create({
      userId,
      items: [
        {
          bookId: book._id,
          quantity: quantity,
          price: book.price,
        },
      ],
      totalPrice: book.price * quantity,
    })

    return newCart
  }

  _mapToEntity(mongoDoc) {
    return CartEntity.create({
      id: mongoDoc._id.toString(),
      userId: mongoDoc.userId.toString(),
      items: mongoDoc.items || [],
      totalPrice: mongoDoc.totalPrice,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
