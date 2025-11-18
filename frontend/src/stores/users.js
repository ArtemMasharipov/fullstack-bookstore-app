import { useNotifications } from '@/composables/useNotifications'
import { usersApi } from '@/services/api/usersApi'
import { defineStore } from 'pinia'

/**
 * Users Store
 * Manages users data and admin operations
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useUsersStore = defineStore('users', {
    state: () => ({
        // Users list
        list: [],
        current: null,

        // Pagination
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,

        // Loading & error states
        loading: false,
        error: null,
    }),

    getters: {
        /**
         * Get user by ID - contains logic, so we keep it
         */
        getUserById: (state) => (id) => state.list.find((user) => user.id === id || user._id === id),
    },

    actions: {
        /**
         * Fetch all users
         */
        async fetchUsers() {
            this.loading = true
            this.error = null

            const { showError } = useNotifications()

            try {
                const users = await usersApi.fetchAll()
                this.list = Array.isArray(users) ? users : []
                return users
            } catch (error) {
                this.error = error.message
                showError('Failed to fetch users', {
                    icon: 'mdi-account-alert',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Create a new user
         */
        async createUser(userData) {
            this.loading = true
            this.error = null

            const { showSuccess } = useNotifications()

            try {
                const result = await usersApi.createUser(userData)
                this.list.unshift(result)
                this.total += 1

                const userName = result.name || result.username || result.email || 'New user'
                showSuccess(`User "${userName}" created successfully`, {
                    icon: 'mdi-account-plus',
                })
                return result
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update an existing user
         */
        async updateUser(id, userData) {
            this.loading = true
            this.error = null

            const { showSuccess } = useNotifications()

            try {
                const result = await usersApi.updateUser(id, userData)

                const index = this.list.findIndex((user) => user.id === id || user._id === id)
                if (index !== -1) {
                    this.list[index] = result
                }

                const userName = result.name || result.username || result.email || 'User'
                showSuccess(`User "${userName}" updated successfully`, {
                    icon: 'mdi-account-edit',
                })
                return result
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Delete a user
         */
        async deleteUser(id) {
            this.loading = true
            this.error = null

            const { showWarning } = useNotifications()

            try {
                const userToDelete = this.list.find((user) => user.id === id || user._id === id)
                const userName = userToDelete?.name || userToDelete?.username || userToDelete?.email || 'User'

                await usersApi.deleteUser(id)

                this.list = this.list.filter((user) => user.id !== id && user._id !== id)
                this.total = Math.max(0, this.total - 1)

                showWarning(`User "${userName}" deleted successfully`, {
                    icon: 'mdi-account-remove',
                })
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch user by ID
         */
        async fetchUserById(id) {
            this.loading = true
            this.error = null

            const { showError } = useNotifications()

            try {
                const user = await usersApi.fetchById(id)
                this.current = user
                return user
            } catch (error) {
                this.error = error.message
                showError('Failed to fetch user details', {
                    icon: 'mdi-account-alert',
                })
                throw error
            } finally {
                this.loading = false
            }
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


