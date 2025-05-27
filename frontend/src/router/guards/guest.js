/**
 * Guest Guard
 * Защита для страниц только для неаутентифицированных пользователей
 */

import { useAuthStore } from '@/store'

export const guestGuard = (to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  if (isAuthenticated) {
    // Если пользователь уже аутентифицирован, перенаправляем на главную
    next({ name: 'Home' })
    return
  }

  next()
}
