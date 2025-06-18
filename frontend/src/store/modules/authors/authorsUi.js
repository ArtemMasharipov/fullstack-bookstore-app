import { useAuthorsStore } from '@/store/modules/authors/authors'
import { defineStore } from 'pinia'

/**
 * Store for managing Authors UI state and interactions
 */
export const useAuthorsUiStore = defineStore('authorsUi', {
    state: () => ({
        showForm: false,
        selectedAuthor: null,
        showDeleteConfirm: false,
        authorToDelete: null,
    }),

    getters: {
        getShowForm: (state) => state.showForm,
        getSelectedAuthor: (state) => state.selectedAuthor,
        getShowDeleteConfirm: (state) => state.showDeleteConfirm,
        getAuthorToDelete: (state) => state.authorToDelete,
    },

    actions: {
        /**
         * Fetch authors from API
         */
        async fetchAuthors() {
            const authorsStore = useAuthorsStore()

            try {
                await authorsStore.fetchAuthors()
                return authorsStore.authorsList
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (error.status !== 401) {
                    // Error handling without toast notifications
                }
                throw error
            }
        },

        /**
         * Handle generic author action with error handling
         */
        async handleAction(action, ...args) {
            const authorsStore = useAuthorsStore()
            try {
                await action(...args)
                await this.fetchAuthors()
                this.closeForm()
                return true
            } catch (error) {
                // Error handling without toast notifications
                throw error
            }
        },

        /**
         * Open create author form
         */
        openCreateForm() {
            this.selectedAuthor = { _id: null, name: '', biography: '' }
            this.showForm = true
        },

        /**
         * Open edit author form
         */
        openEditForm(author) {
            this.selectedAuthor = { ...author }
            this.showForm = true
        },

        /**
         * Close form modal
         */
        closeForm() {
            this.showForm = false
            this.selectedAuthor = null
        },

        /**
         * Handle form submission for author creation/update
         */
        async handleFormSubmit(formData) {
            const authorsStore = useAuthorsStore()

            const action = formData._id
                ? (data) => authorsStore.updateAuthor(data)
                : (data) => authorsStore.createAuthor(data)

            try {
                await this.handleAction(action, formData)
                return true
            } catch (error) {
                return false
            }
        },

        /**
         * Open delete confirmation dialog
         */
        handleDelete(authorId) {
            this.authorToDelete = authorId
            this.showDeleteConfirm = true
        },

        /**
         * Confirm and perform author deletion
         */
        async confirmDelete() {
            const authorsStore = useAuthorsStore()

            try {
                await this.handleAction((id) => authorsStore.deleteAuthor(id), this.authorToDelete)
                this.showDeleteConfirm = false
                this.authorToDelete = null
                return true
            } catch (error) {
                return false
            }
        },

        /**
         * Cancel author deletion
         */
        cancelDelete() {
            this.showDeleteConfirm = false
            this.authorToDelete = null
        },
    },
})
