import { Router } from 'express'
import { authValidationSchema } from '../../../shared/validation/authValidationSchema.js'
import { authController } from '../../controllers/v1/authController.js'
import { checkAuth } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.post(
  '/register',
  validateRequest(authValidationSchema.register),
  authController.register
)
router.post(
  '/login',
  validateRequest(authValidationSchema.login),
  authController.login
)
router.post('/logout', authController.logout)
router.post('/verify-token', authController.verifyToken)

router.post(
  '/change-password',
  checkAuth,
  validateRequest(authValidationSchema.changePassword),
  authController.changePassword
)

export default router
