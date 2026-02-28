/**
 * Guest Guard
 * Guard for pages accessible only to unauthenticated users
 */

import { useAuthStore } from '@/stores'

export const guestGuard = async (to, from, next) => {
    const authStore = useAuthStore()
    let isAuthenticated = authStore.isAuthenticated

    if (isAuthenticated) {
        const isValid = await authStore.checkAuthStatus()
        if (!isValid) {
            isAuthenticated = false
        }
    }

    if (isAuthenticated) {
        // If user is already authenticated, redirect to home
        next({ name: 'Home' })
        return
    }

    next()
}
