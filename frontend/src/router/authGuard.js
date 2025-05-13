import { useAuthStore } from '@/stores'

const authGuard = async (to, from, next) => {
    const authStore = useAuthStore()
    let isAuthenticated = authStore.isAuthenticated
    const requiredPermission = to.meta.requiredPermission

    // For protected routes, verify the token is still valid
    if (to.meta.requiresAuth && isAuthenticated) {
        // Check if the token is valid
        const isValid = await authStore.checkAuthStatus()
        if (!isValid) {
            isAuthenticated = false
        }
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
        // Store the attempted URL for redirecting after login
        if (to.path !== '/login' && to.path !== '/register') {
            localStorage.setItem('redirectPath', to.fullPath)
        }
        next('/login')
        return
    }

    if (requiredPermission && !authStore.hasPermission(requiredPermission)) {
        next('/unauthorized')
        return
    }

    next()
}

export default authGuard
