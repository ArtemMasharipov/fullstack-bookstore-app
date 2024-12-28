import store from '@/store'

const authGuard = (to, from, next) => {
    const isAuthenticated = store.getters['auth/isAuthenticated']
    const requiredPermission = to.meta.requiredPermission
    
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login')
        return
    }
    
    if (requiredPermission && !store.getters['auth/hasPermission'](requiredPermission)) {
        next('/unauthorized')
        return
    }
    
    next()
}

export default authGuard