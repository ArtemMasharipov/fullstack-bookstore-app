import { Router } from 'express'
import { userValidationSchema } from '../../../shared/validation/userValidationSchema.js'
import { userController } from '../../controllers/v1/userController.js'
import { checkAuth } from '../../middleware/authMiddleware.js'
import { validateRequest } from '../../middleware/validationMiddleware.js'

const router = Router()

router.get('/', userController.getAllUsers)
router.get('/:id', userController.getUserById)
router.post(
  '/',
  validateRequest(userValidationSchema.create),
  userController.createUser
)

router.get('/profile/me', checkAuth, userController.getProfile)
router.put(
  '/profile/me',
  checkAuth,
  validateRequest(userValidationSchema.update),
  userController.updateProfile
)

router.put(
  '/:id',
  checkAuth,
  validateRequest(userValidationSchema.update),
  userController.updateUser
)
router.delete('/:id', checkAuth, userController.deleteUser)

export default router
