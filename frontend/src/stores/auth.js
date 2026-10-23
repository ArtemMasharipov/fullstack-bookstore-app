import { can } from '@/auth/capabilities'
import { useNotifications } from '@/composables/useNotifications'
import { authApi } from '@/services/api/authService'
import { jwtDecode } from 'jwt-decode'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

/**
 * Authentication Store
 * Manages user authentication and the token. What the user may do comes from
 * their role through can() (src/auth/capabilities.js).
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        // Auth state
        token: localStorage.getItem('token') || null,
        user: null,
        // Whether the user has come from the server since the app loaded; the cached one may be out of date
        userChecked: false,

        // Loading & error states
        loading: false,
        error: null,
        accountBusy: false,
        _accountRevision: 0,
        _accountOperation: 0,
    }),

    getters: {
        /**
         * Check if user is authenticated
         */
        isAuthenticated: (state) => !!state.token,

        /**
         * Check if user is admin
         */
        isAdmin: (state) => can(state.user?.role, 'admin'),
    },

    actions: {
        _accountMarker() {
            return { token: this.token, revision: this._accountRevision }
        },

        _isCurrentAccount(marker) {
            return this.token === marker.token && this._accountRevision === marker.revision
        },

        _invalidateAccountWork() {
            this._accountRevision += 1
            this._accountOperation += 1
            this.accountBusy = false
        },

        _storeAccountUser(user) {
            localStorage.setItem('userData', JSON.stringify(user))
            this.user = user
            this.userChecked = true
        },

        async loadProfile() {
            if (!this.token) return null
            const marker = this._accountMarker()
            try {
                const response = await authApi.getCurrentUser(marker.token)
                if (!this._isCurrentAccount(marker)) return null
                if (!response?.data || typeof response.data !== 'object') throw new Error('Invalid profile response')
                this._storeAccountUser(response.data)
                return response.data
            } catch (error) {
                if (!this._isCurrentAccount(marker)) return null
                throw error
            }
        },

        async _mutateAccount(request, apply) {
            if (this.accountBusy || !this.token) return null
            this._accountRevision += 1
            const marker = this._accountMarker()
            const operation = ++this._accountOperation
            this.accountBusy = true
            try {
                let response
                try {
                    response = await request(marker.token)
                } catch (error) {
                    if (!this._isCurrentAccount(marker)) return null
                    throw error
                }
                if (!this._isCurrentAccount(marker)) return null
                return await apply(response, marker)
            } finally {
                if (this._accountOperation === operation) this.accountBusy = false
            }
        },

        async updateProfile(body) {
            return this._mutateAccount(
                (token) => authApi.updateProfile(body, token),
                (response) => {
                    const user = response?.data
                    if (!user || typeof user.id !== 'string') throw new Error('Invalid profile response')
                    this._storeAccountUser(user)
                    this._accountRevision += 1
                    useNotifications().showSuccess(undefined, { messageKey: 'profile.saved' })
                    return user
                }
            )
        },

        async changePassword(body) {
            return this._mutateAccount(
                (token) => authApi.changePassword(body, token),
                (response) => {
                    const { user, token } = response?.data ?? {}
                    if (!user || typeof user.id !== 'string' || typeof token !== 'string' || !token)
                        throw new Error('Invalid password response')
                    localStorage.setItem('userData', JSON.stringify(user))
                    localStorage.setItem('token', token)
                    this.user = user
                    this.token = token
                    this.userChecked = true
                    this._accountRevision += 1
                    useNotifications().showSuccess(undefined, { messageKey: 'profile.passwordChanged' })
                    return { user, token }
                }
            )
        },

        async logoutAll() {
            return this._mutateAccount(
                (token) => authApi.logoutAll(token),
                async (_response, marker) => {
                    const { resetSession } = await import('@/services/session')
                    if (!this._isCurrentAccount(marker)) return null
                    const navigation = resetSession({ wayBack: false })
                    const revision = this._accountRevision
                    await navigation
                    if (!this.token && this._accountRevision === revision)
                        useNotifications().showSuccess(undefined, { messageKey: 'profile.signedOutAll' })
                }
            )
        },

        /** Session reset invalidates pending work without resetting the revision counter. */
        forget() {
            this.clearAuth()
            this.loading = false
        },
        /**
         * Takes the user from the server once per app load, so the role is the server's and not the one cached
         * in localStorage. Without a connection the cached user stays; an answer with an error status is thrown on
         * (a 401 ends the session in the API client).
         */
        async ensureFreshUser() {
            if (this.userChecked || !this.token) return
            try {
                await this.loadProfile()
            } catch (error) {
                if (error?.status) throw error
            }
        },

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
                this._invalidateAccountWork()

                // Update state
                this.user = user
                this.token = token
                this.userChecked = true

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
                this._invalidateAccountWork()

                // Update state
                this.user = user
                this.token = token
                this.userChecked = true

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
         * Logout user. The session ends on this device at once; the server ends its
         * own session when it hears about it, and its answer changes nothing here.
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
                } else {
                    // Use token data as fallback
                    this.user = decoded

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
                    await this.loadProfile()
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
            this._invalidateAccountWork()
            this.user = null
            this.token = null
            this.userChecked = false
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
