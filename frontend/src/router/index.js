import { createRouter, createWebHistory } from 'vue-router'
import { buildRoutes } from './buildRoutes.js'
import unifiedGuard from './guards/unified.js'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes: buildRoutes(),
})

router.beforeEach(unifiedGuard)

// Centralised page title — reads from route meta set in the manifest.
router.afterEach((to) => {
    document.title = to.meta.title ? `${to.meta.title} | Bookstore` : 'Bookstore'
})

export default router
