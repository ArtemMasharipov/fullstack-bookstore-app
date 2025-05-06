import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

/**
 * Auth UI Store - Manages Auth-related UI state and interactions
 */
export const useAuthUiStore = defineStore('authUi', {
    state: () => ({
        // UI-specific state that doesn't belong in the core auth store
        redirectPath: '/',
        showSessionExpiredModal: false,
        rememberMe: false,
    }),

    getters: {
        getRedirectPath: (state) => state.redirectPath,
        getShowSessionExpiredModal: (state) => state.showSessionExpiredModal,
        getRememberMe: (state) => state.rememberMe,
    },

    actions: {
        /**
         * Handle login form submission
         * @param {Object} credentials - User credentials
         * @param {string} credentials.email - User email
         * @param {string} credentials.password - User password
         */
        async handleLogin(credentials) {
            const authStore = useAuthStore()

            // Clear any previous errors
            authStore.$patch({ error: null })
            try {
                // Attempt login
                await authStore.login(credentials)
                return true
            } catch (error) {
                return false
            }
        },

        /**
         * Handle registration form submission
         * @param {Object} userData - User registration data
         */
        async handleRegister(userData) {
            const authStore = useAuthStore()

            // Clear any previous errors
            authStore.$patch({ error: null })

            try {
                // Attempt registration
                await authStore.register(userData)
                return true
            } catch (error) {
                return false
            }
        },

        /**
         * Set the path to redirect after authentication
         * @param {string} path - Path to redirect to
         */
        setRedirectPath(path) {
            this.redirectPath = path
        },

        /**
         * Handle logout action
         */
        async handleLogout() {
            const authStore = useAuthStore()
            await authStore.logout()
        },

        /**
         * Show session expired modal
         */
        showSessionExpired() {
            this.showSessionExpiredModal = true
        },

        /**
         * Hide session expired modal
         */
        hideSessionExpired() {
            this.showSessionExpiredModal = false
        },

        /**
         * Clear auth errors in the main auth store
         */
        clearError() {
            const authStore = useAuthStore()
            authStore.$patch({ error: null })
        },

        /**
         * Set remember me preference
         * @param {boolean} value
         */
        setRememberMe(value) {
            this.rememberMe = value
        },
    },
})
