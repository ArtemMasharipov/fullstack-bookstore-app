import { createRouter, createWebHistory } from 'vue-router'
import authGuard from './guards/auth.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { errorRoutes } from './routes/errors.js'
import { ordersRoutes } from './routes/orders.js'
import { publicRoutes } from './routes/public.js'

// Объединяем все маршруты
const routes = [...publicRoutes, ...authRoutes, ...ordersRoutes, ...adminRoutes, ...errorRoutes]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes,
})

router.beforeEach(authGuard)

export default router
