import { useUsersStore } from '@/store/modules/users'
import { defineStore } from 'pinia'

/**
 * Store for managing Users UI state and interactions
 * Handles confirmation dialogs, user management UI state, etc.
 */

export const useUsersUiStore = defineStore('usersUi', {
    state: () => ({
        // Dialog states
        showCreateDialog: false,
        showEditDialog: false,
        showDeleteDialog: false,
        showDetailsDialog: false,

        // Selected user for operations
        selectedUser: null,

        // Form states
        formLoading: false,
        formErrors: {},

        // Table/List UI states
        selectedUsers: [],
        sortBy: 'name',
        sortOrder: 'asc',
        searchQuery: '',

        // Pagination UI
        currentPage: 1,
        itemsPerPage: 10,

        // Filters
        activeFilters: {
            role: null,
            status: null,
            dateRange: null,
        },
    }),

    getters: {
        // Dialog state getters
        isAnyDialogOpen: (state) => {
            return state.showCreateDialog || state.showEditDialog || state.showDeleteDialog || state.showDetailsDialog
        },

        // Selection getters
        hasSelectedUsers: (state) => state.selectedUsers.length > 0,
        selectedUserCount: (state) => state.selectedUsers.length,

        // Form getters
        hasFormErrors: (state) => Object.keys(state.formErrors).length > 0,

        // Filter getters
        hasActiveFilters: (state) => {
            return Object.values(state.activeFilters).some((filter) => filter !== null)
        },

        // Search getter
        isSearchActive: (state) => state.searchQuery.length > 0,
    },

    actions: {
        // Dialog actions
        openCreateDialog() {
            this.showCreateDialog = true
            this.selectedUser = null
            this.clearFormErrors()
        },

        openEditDialog(user) {
            this.showEditDialog = true
            this.selectedUser = user
            this.clearFormErrors()
        },

        openDeleteDialog(user) {
            this.showDeleteDialog = true
            this.selectedUser = user
        },

        openDetailsDialog(user) {
            this.showDetailsDialog = true
            this.selectedUser = user
        },

        closeAllDialogs() {
            this.showCreateDialog = false
            this.showEditDialog = false
            this.showDeleteDialog = false
            this.showDetailsDialog = false
            this.selectedUser = null
            this.clearFormErrors()
        },

        // Form actions
        setFormLoading(loading) {
            this.formLoading = loading
        },

        setFormErrors(errors) {
            this.formErrors = errors || {}
        },

        clearFormErrors() {
            this.formErrors = {}
        },

        // Selection actions
        selectUser(user) {
            const index = this.selectedUsers.findIndex((u) => u.id === user.id)
            if (index === -1) {
                this.selectedUsers.push(user)
            }
        },

        deselectUser(user) {
            const index = this.selectedUsers.findIndex((u) => u.id === user.id)
            if (index !== -1) {
                this.selectedUsers.splice(index, 1)
            }
        },

        toggleUserSelection(user) {
            const index = this.selectedUsers.findIndex((u) => u.id === user.id)
            if (index === -1) {
                this.selectedUsers.push(user)
            } else {
                this.selectedUsers.splice(index, 1)
            }
        },

        selectAllUsers(users) {
            this.selectedUsers = [...users]
        },

        clearSelection() {
            this.selectedUsers = []
        },

        // Sorting actions
        setSortBy(field) {
            if (this.sortBy === field) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
            } else {
                this.sortBy = field
                this.sortOrder = 'asc'
            }
        },

        // Search actions
        setSearchQuery(query) {
            this.searchQuery = query
            this.currentPage = 1 // Reset to first page when searching
        },

        clearSearch() {
            this.searchQuery = ''
        },

        // Pagination actions
        setCurrentPage(page) {
            this.currentPage = page
        },

        setItemsPerPage(count) {
            this.itemsPerPage = count
            this.currentPage = 1 // Reset to first page when changing items per page
        },

        // Filter actions
        setFilter(filterName, value) {
            this.activeFilters[filterName] = value
            this.currentPage = 1 // Reset to first page when filtering
        },

        clearFilter(filterName) {
            this.activeFilters[filterName] = null
        },

        clearAllFilters() {
            this.activeFilters = {
                role: null,
                status: null,
                dateRange: null,
            }
            this.currentPage = 1
        }, // Reset all UI state
        resetUiState() {
            this.closeAllDialogs()
            this.clearSelection()
            this.clearSearch()
            this.clearAllFilters()
            this.currentPage = 1
            this.sortBy = 'name'
            this.sortOrder = 'asc'
        },

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
         */
        async fetchUsers() {
            const usersStore = useUsersStore()
            try {
                return await usersStore.fetchUsers()
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (error.status !== 401) {
                    console.error('Failed to fetch users:', error.message || error)
                }
            }
        },

        /**
         * Open confirmation dialog for user deletion
         */
        confirmDelete(user) {
            this.selectedUser = user
            this.showDeleteDialog = true
        },

        /**
         * Cancel the deletion process
         */
        cancelDelete() {
            this.selectedUser = null
            this.showDeleteDialog = false
        },

        /**
         * Delete the user after confirmation
         */
        async performDelete() {
            if (!this.selectedUser || !this.selectedUser.id) return

            const usersStore = useUsersStore()

            try {
                await usersStore.deleteUser(this.selectedUser.id)
                this.showDeleteDialog = false
                this.selectedUser = null
                console.log('User deleted successfully')
            } catch (error) {
                console.error('Failed to delete user:', error.message || error)
            }
        },
    },
})
