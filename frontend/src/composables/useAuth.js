/**
 * Composable for handling authentication-related logic
 * Provides reactive auth state and methods for authentication operations
 */
import { useAuthStore } from '@/store'
import { storeToRefs } from 'pinia'

export function useAuth() {
    const authStore = useAuthStore()
    const { isAuthenticated, user, loading, error } = storeToRefs(authStore)
    
    return {
        // State
        isAuthenticated,
        user,
        loading,
        error,
        
        // Methods
        login: authStore.login,
        logout: authStore.logout,
        register: authStore.register,
        
        // Helpers
        hasPermission: authStore.hasPermission,
        checkAuthStatus: authStore.checkAuthStatus,
        initialize: authStore.initialize,
    }
}
