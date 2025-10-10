import { useNotifications } from '@/composables/useNotifications'
import { authApi } from '@/services/api/authService'
import { useCartStore } from '@/store/modules/cart/cart'
import { handleAsyncAction } from '@/store/utils/stateHelpers'
import { createBaseStore } from '@/store/utils/storeFactory'
import { jwtDecode } from 'jwt-decode'

/**
 * Authentication store using the base store factory
 * - Uses shared logic from the factory for loading and error states
 * - Implements authentication-specific functionality
 */
export const useAuthStore = createBaseStore({
    id: 'auth',
    api: authApi,

    // Custom state specific to auth store
    customState: () => ({
        token: localStorage.getItem('token') || null,
        user: null,
        permissions: [],
    }),

    // Custom getters specific to auth store
    customGetters: {
        isAuthenticated: (state) => !!state.token,
        currentUser: (state) => state.user,
        authToken: (state) => state.token,
        authLoading: (state) => state.loading,
        authError: (state) => state.error,
        hasPermission: (state) => (permission) => state.permissions.includes(permission),
    },

    // Custom actions specific to auth store
    customActions: {
        /**
         * Initialize the auth store
         */
        async initialize() {
            const token = localStorage.getItem('token')
            if (token) {
                this.token = token
                this.restoreUserFromToken()
            }
        },
        /**
         * Log in a user
         * @param {Object} credentials - Login credentials
         */
        async login(credentials) {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const response = await authApi.login(credentials)

                // Check if we have both user and token in the response
                if (!response || !response.user || !response.token) {
                    throw new Error('Invalid login response from server')
                }

                const { user, token } = response
                this.user = user
                this.token = token
                this.permissions = user.permissions || []

                // Save data in localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('userData', JSON.stringify(user))

                // Sync cart after login
                const cartStore = useCartStore()
                await cartStore.syncCart()

                // User login success - show toast notification
                showSuccess(`Welcome back, ${user.name || user.email || 'User'}!`, {
                    sound: 'success',
                    icon: 'mdi-account-check',
                })

                return response
            } catch (error) {
                this.error = error.message || 'Login failed'
                this.user = null
                this.token = null
                this.permissions = []
                localStorage.removeItem('token')
                localStorage.removeItem('userData')

                // Login failed - show error notification
                showError(`Login failed: ${error.message || 'Invalid credentials'}`, {
                    icon: 'mdi-account-alert',
                })

                throw error
            } finally {
                this.loading = false
            }
        },
        /**
         * Register a new user
         * @param {Object} userData - User registration data
         */
        async register(userData) {
            const { showSuccess, showError } = useNotifications()

            return handleAsyncAction(
                this,
                async () => {
                    const { user, token } = await authApi.register(userData)
                    this.user = user
                    this.token = token
                    this.permissions = user.permissions || []
                    localStorage.setItem('token', token)
                    localStorage.setItem('userData', JSON.stringify(user))

                    // Registration success - show toast notification
                    showSuccess(`Welcome to Bookstore, ${user.name || user.email || 'User'}!`, {
                        sound: 'success',
                        icon: 'mdi-account-plus',
                    })

                    return { user, token }
                },
                {
                    onError: (error) => {
                        // Registration failed - show error notification
                        showError(`Registration failed: ${error.message || 'Please try again'}`, {
                            icon: 'mdi-account-remove',
                        })
                    },
                }
            )
        },
        /**
         * Log out the current user
         */
        async logout() {
            const userName = this.user?.name || this.user?.email || 'User'
            const { showSuccess, showError } = useNotifications()

            return handleAsyncAction(
                this,
                async () => {
                    await authApi.logout()
                    this.user = null
                    this.token = null
                    this.permissions = []
                    localStorage.removeItem('token')
                    localStorage.removeItem('userData')

                    // Logout success - show toast notification
                    showSuccess(`${userName} has been logged out`, {
                        sound: 'info',
                        icon: 'mdi-logout',
                    })
                },
                {
                    onError: (error) => {
                        // Logout failed - show error notification
                        showError(`Logout failed: ${error.message}`, {
                            icon: 'mdi-logout-variant',
                        })
                    },
                }
            )
        },

        /**
         * Restore user data from token in localStorage
         */
        restoreUserFromToken() {
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    // Decode token for basic authentication
                    const decoded = jwtDecode(token)
                    this.token = token

                    // Check if we have saved full user data in localStorage
                    const userData = localStorage.getItem('userData')
                    if (userData) {
                        try {
                            // If we have cached data, use it
                            this.user = JSON.parse(userData)
                            this.permissions = this.user.permissions || []
                        } catch (parseError) {
                            // If parsing error, use token data
                            this.user = decoded
                            this.permissions = decoded.permissions || []
                        }
                    } else {
                        // If no cached data, set from token
                        this.user = decoded
                        this.permissions = decoded.permissions || []

                        // Asynchronously request current user data from server
                        this.fetchCurrentUser()
                    }
                } catch (error) {
                    this.user = null
                    this.permissions = []
                    localStorage.removeItem('token')
                    localStorage.removeItem('userData')
                }
            }
        },

        /**
         * Fetch current user data from server
         */
        async fetchCurrentUser() {
            try {
                // Get current user data from server
                const userData = await authApi.getCurrentUser()
                if (userData) {
                    this.user = userData
                    this.permissions = userData.permissions || []
                    // Save full data in localStorage for later reloads          localStorage.setItem('userData', JSON.stringify(userData));
                }
            } catch (error) {
                // Failed to fetch user data, continue with existing data
            }
        },

        /**
         * Check authentication status and validity of the token
         */
        async checkAuthStatus() {
            const token = localStorage.getItem('token')
            if (!token) return false

            try {
                // Verify token with server or check expiration
                const decoded = jwtDecode(token)

                // If token is expired, handle it
                if (decoded.exp && decoded.exp * 1000 < Date.now()) {
                    this.handleExpiredToken()
                    return false
                }

                return true
            } catch (error) {
                this.handleExpiredToken()
                return false
            }
        },

        /**
         * Handle expired or invalid tokens
         */
        handleExpiredToken() {
            this.user = null
            this.token = null
            this.permissions = []
            localStorage.removeItem('token')
            localStorage.removeItem('userData')
        },
    },
})
