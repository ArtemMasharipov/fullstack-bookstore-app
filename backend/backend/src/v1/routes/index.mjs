import express from 'express';
import booksRoutes from './bookRoutes.mjs';
import authorsRoutes from './authorRoutes.mjs';
import authRoutes from './authRoutes.mjs';
import userRoutes from './userRoutes.mjs';
import roleRoutes from './roleRoutes.mjs';
import cartRoutes from './cartRoutes.mjs';
import orderRoutes from './orderRoutes.mjs';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/books', booksRoutes);
router.use('/authors', authorsRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

router.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

export default router;