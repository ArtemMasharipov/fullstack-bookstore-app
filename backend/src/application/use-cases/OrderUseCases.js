import { OrderDomainService } from '../../domain/services/OrderDomainService.js'
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository.js'

export class OrderUseCases {
  constructor() {
    this.orderRepository = new MongoOrderRepository()
  }

  async getAllOrders() {
    return await this.orderRepository.findAll()
  }

  async getOrderById(id) {
    const order = await this.orderRepository.findById(id)
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }

  async getOrdersByUserId(userId) {
    return await this.orderRepository.findByUserId(userId)
  }

  async createOrder(orderData) {

    OrderDomainService.validateOrderCreation(
      orderData.items,
      orderData.shippingAddress
    )


    const order = await this.orderRepository.create(orderData)
    return order
  }

  async updateOrder(id, updateData) {
    const order = await this.orderRepository.update(id, updateData)
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }

  async updateOrderStatus(id, status) {
    const order = await this.orderRepository.update(id, { status })
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }

  async deleteOrder(id) {
    const order = await this.orderRepository.delete(id)
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }
}

// Legacy exports for backward compatibility
export class CreateOrderUseCase {
  constructor(orderRepository, cartRepository) {
    this.orderRepository = orderRepository
    this.cartRepository = cartRepository
  }

  async execute(userId, shippingAddress) {
    // Get user's cart
    const cart = await this.cartRepository.findByUserId(userId)


    OrderDomainService.validateOrderCreation(cart.items, shippingAddress)


    const order = await this.orderRepository.create({
      userId,
      shippingAddress,
    })

    return order
  }
}

export class GetOrderByIdUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository
  }

  async execute(id) {
    const order = await this.orderRepository.findById(id)
    if (!order) {
      throw new Error('Order not found')
    }
    return order
  }
}

export class UpdateOrderStatusUseCase {
  constructor(orderRepository) {
    this.orderRepository = orderRepository
  }
  async execute(id, newStatus) {
    const order = await this.orderRepository.findById(id)
    if (!order) {
      throw new Error('Order not found')
    }


    OrderDomainService.validateStatusTransition(order.status, newStatus)

    const updatedOrder = await this.orderRepository.updateStatus(id, newStatus)
    return updatedOrder
  }
}
