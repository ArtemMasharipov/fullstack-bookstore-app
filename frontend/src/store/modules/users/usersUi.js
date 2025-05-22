import { useUsersStore } from '@/store/modules/users/users'
import { toast } from '@/store/modules/utils/toast'
import { defineStore } from 'pinia'

/**
 * Store for managing Users UI state and interactions
 * Handles confirmation dialogs, user management UI state, etc.
 */
export const useUsersUiStore = defineStore('usersUi', {
    state: () => ({
        showConfirmDialog: false,
        userToDelete: null,
    }),
    getters: {
        getShowConfirmDialog: (state) => state.showConfirmDialog,
        getUserToDelete: (state) => state.userToDelete,
    },

    actions: {
        /**
         * Initialize the store data
         */
        init() {
            if (this.isAdmin) {
                this.fetchUsers()
            }
        },
        /**
         * Fetch users from the API
         */ async fetchUsers() {
            const usersStore = useUsersStore()
            try {
                return await usersStore.fetchUsers()
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (error.status !== 401) {
                    toast.error(error.message || 'Failed to fetch users')
                }
            }
        },

        /**
         * Open confirmation dialog for user deletion
         */
        confirmDelete(user) {
            this.userToDelete = user
            this.showConfirmDialog = true
        },

        /**
         * Cancel the deletion process
         */
        cancelDelete() {
            this.userToDelete = null
            this.showConfirmDialog = false
        },

        /**
         * Delete the user after confirmation
         */
        async performDelete() {
            if (!this.userToDelete || !this.userToDelete.id) return

            const usersStore = useUsersStore()

            try {
                await usersStore.deleteUser(this.userToDelete.id)
                this.showConfirmDialog = false
                this.userToDelete = null
                toast.success('User deleted successfully')
            } catch (error) {
                toast.error(error.message || 'Failed to delete user')
            }
        },
    },
})
