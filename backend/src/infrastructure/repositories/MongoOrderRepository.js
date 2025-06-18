import { Order as OrderEntity } from '../../domain/entities/Order.js'
import { IOrderRepository } from '../../domain/repositories/IOrderRepository.js'
import { MongooseCRUDManager } from '../database/MongooseCRUDManager.js'
import Cart from '../schemas/CartSchema.js'
import Order from '../schemas/OrderSchema.js'

export class MongoOrderRepository extends IOrderRepository {
  constructor() {
    super()
    this.crudManager = new MongooseCRUDManager(Order)
  }

  async findAll() {
    const orders = await this.crudManager.findAll({}, [
      'items.bookId',
      'userId',
    ])
    return orders.map(order => this._mapToEntity(order))
  }

  async findById(id) {
    const order = await this.crudManager.findById(id, [
      'items.bookId',
      'userId',
    ])
    return order ? this._mapToEntity(order) : null
  }

  async findByUserId(userId) {
    const orders = await this.crudManager.findAll({ userId }, ['items.bookId'])
    return orders.map(order => this._mapToEntity(order))
  }

  async create(orderData) {
    const { userId, shippingAddress } = orderData

    const cart = await Cart.findOne({ userId }).populate('items.bookId')
    if (!cart || cart.items.length === 0) {
      throw new Error('Cart is empty')
    }

    const order = await this.crudManager.create({
      userId,
      items: cart.items,
      totalPrice: cart.totalPrice,
      shippingAddress,
      status: 'pending',
    })

    await Cart.deleteOne({ userId })

    return this._mapToEntity(order)
  }

  async update(id, updateData) {
    const order = await this.crudManager.update(id, updateData)
    return order ? this._mapToEntity(order) : null
  }

  async updateStatus(id, status) {
    const order = await this.crudManager.update(id, { status })
    return order ? this._mapToEntity(order) : null
  }

  async delete(id) {
    const order = await this.crudManager.delete(id)
    return order ? this._mapToEntity(order) : null
  }

  _mapToEntity(mongoDoc) {
    return OrderEntity.create({
      id: mongoDoc._id.toString(),
      userId: mongoDoc.userId.toString(),
      items: mongoDoc.items || [],
      totalPrice: mongoDoc.totalPrice,
      status: mongoDoc.status,
      shippingAddress: mongoDoc.shippingAddress,
      createdAt: mongoDoc.createdAt,
      updatedAt: mongoDoc.updatedAt,
    })
  }
}
