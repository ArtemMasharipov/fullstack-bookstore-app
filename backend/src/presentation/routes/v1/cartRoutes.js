import { Router } from 'express'
import cartValidationSchema from '../../../shared/validation/cartValidationSchema.js'
import * as cartController from '../../controllers/v1/cartController.js'
import { checkAuth } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.use(checkAuth)

router.get('/', cartController.getCart)
router.post(
  '/add',
  cartValidationSchema,
  validateRequest,
  cartController.addToCart
)
router.put('/update/:id', cartController.updateCartItem)
router.post('/sync', cartController.syncCart)
router.delete('/items/:id', cartController.removeCartItem)

export default router
