/**
 * Admin Guard
 * Проверка административных прав доступа
 */

import { useAuthStore } from '@/store'

export const adminGuard = (to, from, next) => {
  const authStore = useAuthStore()
  const user = authStore.user
  const isAuthenticated = authStore.isAuthenticated

  if (!isAuthenticated) {
    // Если пользователь не аутентифицирован, перенаправляем на логин
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if (!user || user.role !== 'admin') {
    // Если пользователь не админ, перенаправляем на главную
    next({ name: 'Home' })
    return
  }

  next()
}
