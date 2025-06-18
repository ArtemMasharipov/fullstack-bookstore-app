import { Router } from 'express'
import authorRoutes from './authorRoutes.js'
import authRoutes from './authRoutes.js'
import bookRoutes from './bookRoutes.js'
import cartRoutes from './cartRoutes.js'
import orderRoutes from './orderRoutes.js'
import userRoutes from './userRoutes.js'

const router = Router()

router.use('/books', bookRoutes)
router.use('/authors', authorRoutes)
router.use('/cart', cartRoutes)
router.use('/users', userRoutes)
router.use('/orders', orderRoutes)
router.use('/auth', authRoutes)

export default router
