import { OrderUseCases } from '../../../application/use-cases/OrderUseCases.js'

const orderUseCases = new OrderUseCases()

export const orderController = {
  async getAllOrders(req, res, next) {
    try {
      const orders = await orderUseCases.getAllOrders()
      res.json(orders)
    } catch (error) {
      next(error)
    }
  },
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params
      const order = await orderUseCases.getOrderById(id)

      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      res.json(order)
    } catch (error) {
      next(error)
    }
  },
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params
      const orders = await orderUseCases.getOrdersByUserId(userId)
      res.json(orders)
    } catch (error) {
      next(error)
    }
  },
  async getMyOrders(req, res, next) {
    try {
      const userId = req.user.id // Assuming auth middleware sets req.user
      const orders = await orderUseCases.getOrdersByUserId(userId)
      res.json(orders)
    } catch (error) {
      next(error)
    }
  },
  async createOrder(req, res, next) {
    try {
      const orderData = req.body
      const userId = req.user.id

      const order = await orderUseCases.createOrder({
        ...orderData,
        userId,
      })

      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  },
  async updateOrderStatus(req, res, next) {
    try {
      const { id } = req.params
      const { status } = req.body

      const order = await orderUseCases.updateOrderStatus(id, status)

      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      res.json(order)
    } catch (error) {
      next(error)
    }
  },
  async updateOrder(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body
      const order = await orderUseCases.updateOrder(id, updateData)

      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      res.json(order)
    } catch (error) {
      next(error)
    }
  },
  async deleteOrder(req, res, next) {
    try {
      const { id } = req.params
      const order = await orderUseCases.deleteOrder(id)

      if (!order) {
        return res.status(404).json({ error: 'Order not found' })
      }

      res.json({ message: 'Order deleted successfully' })
    } catch (error) {
      next(error)
    }
  },
}
