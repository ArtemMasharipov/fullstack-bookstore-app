import { useNotifications } from '@/composables/useNotifications'
import { authApi } from '@/services/api/authService'
import { jwtDecode } from 'jwt-decode'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

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
                // Auth initialization failed
                this.clearAuth()
            }
        },

        /**
         * After sign-in: the guest cart joins the account cart; without one,
         * the account cart is loaded
         */
        async _takeOverCart() {
            const { useCartStore } = await import('@/stores/cart')
            const cartStore = useCartStore()
            if (!(await cartStore.mergeGuestCart())) await cartStore.load()
        },

        /**
         * Login user
         */
        async login(credentials) {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
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

                await this._takeOverCart()

                showSuccess(undefined, {
                    messageKey: 'notifications.welcomeBack',
                    messageParams: { name: user.name || user.email || '' },
                    icon: 'mdi-account-check',
                })

                return response
            })
        },

        /**
         * Register new user
         */
        async register(userData) {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
                const response = await authApi.register(userData)
                const { user, token } = response.data

                // Update state
                this.user = user
                this.token = token
                this.permissions = user.permissions || []

                // Save to localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('userData', JSON.stringify(user))

                await this._takeOverCart()

                showSuccess(undefined, {
                    messageKey: 'notifications.welcome',
                    messageParams: { name: user.name || user.email || '' },
                    icon: 'mdi-account-plus',
                })

                return { user, token }
            })
        },

        /**
         * Logout user. The session ends on this device at once; the server, which
         * keeps no session for a token, hears about it afterwards and its answer
         * changes nothing.
         */
        async logout() {
            const token = this.token
            const { resetSession } = await import('@/services/session')
            await resetSession({ wayBack: false })
            useNotifications().showSuccess(undefined, { messageKey: 'notifications.logoutSuccess', icon: 'mdi-logout' })
            if (token) authApi.logout(token).catch(() => {})
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
                // Failed to restore user from token
                this.clearAuth()
            }
        },

        /**
         * Fetch current user from server
         */
        async fetchCurrentUser() {
            return withLoading(
                this,
                async () => {
                    const response = await authApi.getCurrentUser()
                    if (response?.data) {
                        this.user = response.data
                        this.permissions = response.data.permissions || []
                        localStorage.setItem('userData', JSON.stringify(response.data))
                    }
                },
                { throwError: false }
            )
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
