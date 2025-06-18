import { useNotifications } from '@/composables/useNotifications'
import { usersApi } from '@/services/api/usersApi'
import { createBaseStore, handleAsyncAction } from '@/store/modules/ui'

/**
 * Users store using the base store factory
 * - Uses shared logic from the factory to eliminate code duplication
 * - Preserves specific user store functionality
 */
export const useUsersStore = createBaseStore({
    id: 'users',
    api: usersApi,

    // Custom state specific to users store
    customState: () => ({
        // Map to maintain API compatibility with existing components
        list: [], // This will be synced with 'items' in the base store
    }),

    // Custom getters specific to users store
    customGetters: {
        // Map base store getters to user-specific names for API compatibility
        usersList: (state) => state.list || state.items,
        currentUser: (state) => state.current,
        usersLoading: (state) => state.loading,
        usersError: (state) => state.error,

        // Custom getter that is specific to this store
        getUserById: (state) => (id) => (state.list || state.items).find((user) => user.id === id),
    },

    // Custom actions specific to users store
    customActions: {
        /**
         * Fetch all users
         */
        async fetchUsers() {
            try {
                const users = await this.fetchAll()
                this.list = users // Keep list in sync with items
                return users
            } catch (error) {
                const { showError } = useNotifications()
                showError('Failed to fetch users', {
                    icon: 'mdi-account-alert',
                })
                throw error
            }
        },

        /**
         * Create a new user
         * @param {Object} userData - Data for the new user
         */
        async createUser(userData) {
            return handleAsyncAction(this, async () => {
                const result = await usersApi.createUser(userData)

                // Add the new user to the list
                this.items.unshift(result)
                this.list = [...this.items] // Ensure list stays in sync with items

                const userName = result.name || result.username || result.email || 'New user'
                const { showSuccess } = useNotifications()
                showSuccess(`User "${userName}" created successfully`, {
                    sound: 'success',
                    icon: 'mdi-account-plus',
                })
                return result
            })
        },

        /**
         * Update an existing user
         * @param {string} id - User ID
         * @param {Object} userData - Updated user data
         */
        async updateUser(id, userData) {
            return handleAsyncAction(this, async () => {
                const result = await usersApi.updateUser(id, userData)

                // Update the user in the list
                const index = this.items.findIndex((user) => user.id === id)
                if (index !== -1) {
                    this.items[index] = result
                    this.list = [...this.items] // Ensure list stays in sync with items
                }

                const userName = result.name || result.username || result.email || 'User'
                const { showSuccess } = useNotifications()
                showSuccess(`User "${userName}" updated successfully`, {
                    sound: 'success',
                    icon: 'mdi-account-edit',
                })
                return result
            })
        },

        /**
         * Delete a user
         * @param {string} id - User ID
         */
        async deleteUser(id) {
            return handleAsyncAction(this, async () => {
                // Get user data before deletion for notification
                const userToDelete = this.items.find((user) => user.id === id)
                const userName = userToDelete?.name || userToDelete?.username || userToDelete?.email || 'User'

                const result = await usersApi.deleteUser(id)

                // Remove the user from the list
                this.items = this.items.filter((user) => user.id !== id)
                this.list = [...this.items] // Ensure list stays in sync with items

                const { showWarning } = useNotifications()
                showWarning(`User "${userName}" deleted successfully`, {
                    sound: 'warning',
                    icon: 'mdi-account-remove',
                })
                return result
            })
        },

        /**
         * Fetch user by ID
         * @param {string} id - User ID
         */
        async fetchUserById(id) {
            try {
                const user = await this.fetchById(id)
                return user
            } catch (error) {
                const { showError } = useNotifications()
                showError('Failed to fetch user details', {
                    icon: 'mdi-account-alert',
                })
                throw error
            }
        },

        /**
         * Custom initialize method to ensure arrays are properly set
         */
        async initializeStore() {
            // Initialize arrays if they're not already
            if (!Array.isArray(this.list)) {
                this.list = []
            }
            if (!Array.isArray(this.items)) {
                this.items = []
            }

            // Call the base implementation
            if (!this.initialized) {
                // If API is provided, fetch initial data
                try {
                    await this.fetchUsers()
                } catch (error) {
                    // Silently handle errors during initialization
                    const { showError } = useNotifications()
                    showError('Failed to initialize users store', {
                        icon: 'mdi-alert-circle',
                    })
                }

                this.initialized = true
            }

            return true
        },
    },
})
