/**
 * Guest Guard
 * Защита для страниц только для неаутентифицированных пользователей
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
        // Если пользователь уже аутентифицирован, перенаправляем на главную
        next({ name: 'Home' })
        return
    }

    next()
}
