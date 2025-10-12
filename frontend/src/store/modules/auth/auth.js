import { useNotifications } from '@/composables/useNotifications'
import { authApi } from '@/services/api/authService'
import { jwtDecode } from 'jwt-decode'
import { defineStore } from 'pinia'

/**
 * Authentication Store
 * Manages user authentication, tokens, and permissions
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        // Auth state
        token: localStorage.getItem('token') || null,
        user: null,
        permissions: [],

        // Loading & error states
        loading: false,
        error: null,
    }),

    getters: {
        /**
         * Check if user is authenticated
         */
        isAuthenticated: (state) => !!state.token,

        /**
         * Get current user
         */
        currentUser: (state) => state.user,

        /**
         * Get auth token
         */
        authToken: (state) => state.token,

        /**
         * Check loading state
         */
        authLoading: (state) => state.loading,

        /**
         * Get error message
         */
        authError: (state) => state.error,

        /**
         * Check if user is admin
         */
        isAdmin: (state) => {
            return state.user?.role === 'admin' || state.permissions.includes('admin:access')
        },

        /**
         * Check if user has specific permission
         */
        hasPermission: (state) => (permission) => {
            return state.permissions.includes(permission)
        },
    },

    actions: {
        /**
         * Initialize auth store - restore user from token
         */
        async initialize() {
            try {
                const token = localStorage.getItem('token')
                if (token) {
                    this.token = token
                    this.restoreUserFromToken()
                }
            } catch (error) {
                console.warn('Auth initialization failed:', error.message)
                this.clearAuth()
            }
        },

        /**
         * Login user
         */
        async login(credentials) {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const response = await authApi.login(credentials)

                if (!response?.data?.user || !response?.data?.token) {
                    throw new Error('Invalid login response from server')
                }

                const { user, token } = response.data

                // Update state
                this.user = user
                this.token = token
                this.permissions = user.permissions || []

                // Save to localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('userData', JSON.stringify(user))

                // Sync cart after login
                const { useCartStore } = await import('@/store/modules/cart/cart')
                const cartStore = useCartStore()
                await cartStore.syncCart()

                showSuccess(`Welcome back, ${user.name || user.email || 'User'}!`, {
                    icon: 'mdi-account-check',
                })

                return response
            } catch (error) {
                this.error = error.message || 'Login failed'
                this.clearAuth()

                showError(`Login failed: ${error.message || 'Invalid credentials'}`, {
                    icon: 'mdi-account-alert',
                })

                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Register new user
         */
        async register(userData) {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const response = await authApi.register(userData)
                const { user, token } = response.data

                // Update state
                this.user = user
                this.token = token
                this.permissions = user.permissions || []

                // Save to localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('userData', JSON.stringify(user))

                showSuccess(`Welcome to Bookstore, ${user.name || user.email || 'User'}!`, {
                    icon: 'mdi-account-plus',
                })

                return { user, token }
            } catch (error) {
                this.error = error.message || 'Registration failed'

                showError(`Registration failed: ${error.message || 'Please try again'}`, {
                    icon: 'mdi-account-remove',
                })

                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Logout user
         */
        async logout() {
            const userName = this.user?.name || this.user?.email || 'User'
            const { showSuccess, showError } = useNotifications()

            this.loading = true

            try {
                await authApi.logout()

                showSuccess(`${userName} has been logged out`, {
                    icon: 'mdi-logout',
                })
            } catch (error) {
                showError(`Logout failed: ${error.message}`, {
                    icon: 'mdi-logout-variant',
                })
            } finally {
                this.clearAuth()
                this.loading = false
            }
        },

        /**
         * Restore user from JWT token in localStorage
         */
        restoreUserFromToken() {
            const token = localStorage.getItem('token')
            if (!token) return

            try {
                const decoded = jwtDecode(token)
                this.token = token

                // Try to get cached user data
                const userData = localStorage.getItem('userData')
                if (userData) {
                    this.user = JSON.parse(userData)
                    this.permissions = this.user.permissions || []
                } else {
                    // Use token data as fallback
                    this.user = decoded
                    this.permissions = decoded.permissions || []

                    // Fetch current user in background
                    this.fetchCurrentUser()
                }
            } catch (error) {
                console.error('Failed to restore user from token:', error)
                this.clearAuth()
            }
        },

        /**
         * Fetch current user from server
         */
        async fetchCurrentUser() {
            try {
                const response = await authApi.getCurrentUser()
                if (response?.data) {
                    this.user = response.data
                    this.permissions = response.data.permissions || []
                    localStorage.setItem('userData', JSON.stringify(response.data))
                }
            } catch (error) {
                console.warn('Failed to fetch current user:', error.message)
            }
        },

        /**
         * Check auth status and token validity
         */
        async checkAuthStatus() {
            const token = localStorage.getItem('token')
            if (!token) return false

            try {
                const decoded = jwtDecode(token)

                // Check if token is expired
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    this.clearAuth()
                    return false
                }

                return true
            } catch (error) {
                this.clearAuth()
                return false
            }
        },

        /**
         * Clear auth state
         */
        clearAuth() {
            this.user = null
            this.token = null
            this.permissions = []
            this.error = null
            localStorage.removeItem('token')
            localStorage.removeItem('userData')
        },

        /**
         * Set error message
         */
        setError(message) {
            this.error = message
        },

        /**
         * Clear error message
         */
        clearError() {
            this.error = null
        },
    },
})
