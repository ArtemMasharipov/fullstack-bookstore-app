/**
 * Admin Guard
 * Check admin access permissions
 */

import { useAuthStore } from '@/stores'

export const adminGuard = (to, from, next) => {
    const authStore = useAuthStore()
    const user = authStore.user
    const isAuthenticated = authStore.isAuthenticated

    if (!isAuthenticated) {
        // If user is not authenticated, redirect to login
        next({
            name: 'Login',
            query: { redirect: to.fullPath },
        })
        return
    }

    if (!user || user.role !== 'admin') {
        // If user is not an admin, redirect to home
        next({ name: 'Home' })
        return
    }

    next()
}
