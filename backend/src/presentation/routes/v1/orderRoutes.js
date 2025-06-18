import { Router } from 'express'
import { orderValidationSchema } from '../../../shared/validation/orderValidationSchema.js'
import { orderController } from '../../controllers/v1/orderController.js'
import { checkAuth } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.use(checkAuth)

router.get('/my-orders', orderController.getMyOrders)
router.post(
  '/',
  validateRequest(orderValidationSchema.create),
  orderController.createOrder
)
router.get('/:id', orderController.getOrderById)

router.get('/', orderController.getAllOrders)
router.get('/user/:userId', orderController.getUserOrders)
router.put(
  '/:id/status',
  validateRequest(orderValidationSchema.updateStatus),
  orderController.updateOrderStatus
)
router.put(
  '/:id',
  validateRequest(orderValidationSchema.update),
  orderController.updateOrder
)
router.delete('/:id', orderController.deleteOrder)

export default router
