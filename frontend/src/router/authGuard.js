import { useAuthStore } from '@/stores'

const authGuard = (to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
    const requiredPermission = to.meta.requiredPermission
    
    if (to.meta.requiresAuth && !isAuthenticated) {
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