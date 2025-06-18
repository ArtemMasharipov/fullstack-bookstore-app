import { useBooksStore } from '@/store/modules/books/books'
import { useUiStore } from '@/store/modules/ui/ui'
import { debounce } from 'lodash'
import { defineStore } from 'pinia'

/**
 * Store for managing Books UI state and interactions
 * Handles book-specific UI state, forms, filters, and pagination
 */
export const useBooksUiStore = defineStore('booksUi', {
    state: () => ({
        showForm: false,
        selectedBook: null,
        bookToDelete: null,
        currentPage: 1,
        formSubmitting: false,
        itemsPerPage: 12,
        category: null,
        authorId: null,
    }),
    getters: {
        // Remove duplicate getters that cause conflicts
        showDeleteDialog: (state) => !!state.bookToDelete,
        filterParams: (state) => {
            const uiStore = useUiStore()
            const params = {
                page: state.currentPage,
                limit: state.itemsPerPage,
            }

            const searchQuery = uiStore.getSearchQuery('books')
            if (searchQuery) {
                params.search = searchQuery
            }

            if (state.category) {
                params.category = state.category
            }

            if (state.authorId) {
                params.author = state.authorId
            }

            return params
        },
        // Keep only one set of getters with 'get' prefix
        getShowForm: (state) => state.showForm,
        getSelectedBook: (state) => state.selectedBook,
        getBookToDelete: (state) => state.bookToDelete,
        getCurrentPage: (state) => state.currentPage,
        getFormSubmitting: (state) => state.formSubmitting,
        getItemsPerPage: (state) => state.itemsPerPage,
        getCategory: (state) => state.category,
        getAuthorId: (state) => state.authorId,
    },

    actions: {
        /**
         * Initialize with filter options
         */
        initialize({ category = null, authorId = null, itemsPerPage = 12 }) {
            this.category = category
            this.authorId = authorId
            this.itemsPerPage = itemsPerPage
        },

        /**
         * Open create book form
         */
        openCreateForm() {
            this.selectedBook = {}
            this.showForm = true
        },

        /**
         * Open edit book form
         */
        openEditForm(book) {
            this.selectedBook = { ...book }
            this.showForm = true
        },

        /**
         * Close form modal
         */
        closeForm() {
            this.selectedBook = null
            this.showForm = false
        },

        /**
         * Show delete confirmation
         */
        confirmDeleteBook(book) {
            this.bookToDelete = book
        },

        /**
         * Cancel book deletion
         */
        cancelDeleteBook() {
            this.bookToDelete = null
        },
        /**
         * Handle form submission
         */
        async handleFormSubmit(bookData) {
            const booksStore = useBooksStore()

            try {
                this.formSubmitting = true

                if (bookData._id) {
                    await booksStore.updateBook({ id: bookData._id, formData: bookData.formData })
                } else {
                    await booksStore.createBook(bookData.formData)
                }

                await this.loadBooks()
                this.closeForm()
            } catch (error) {
                // Error handling without toast notifications
            } finally {
                this.formSubmitting = false
            }
        },

        /**
         * Handle book deletion
         */
        async deleteBook() {
            if (!this.bookToDelete?._id) return

            const booksStore = useBooksStore()

            try {
                await booksStore.deleteBook(this.bookToDelete._id)
                this.bookToDelete = null
                await this.loadBooks()
            } catch (error) {
                // Error handling without toast notifications
            }
        },

        /**
         * Handle page change
         */
        changePage(page) {
            this.currentPage = page
            this.loadBooks()
        },

        /**
         * Set search query with debounce
         */
        setSearchQueryDebounced(query) {
            const uiStore = useUiStore()
            uiStore.setSearchQuery('books', query)

            // Reset to page 1 on search
            this.currentPage = 1
            this.loadBooks()
        },
        /**
         * Load books with current filters
         */
        async loadBooks() {
            const booksStore = useBooksStore()
            try {
                await booksStore.fetchBooks(this.filterParams)
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (error.status !== 401) {
                    // Error handling without toast notifications
                }
            }
        },

        /**
         * Initialize search with debounce
         */
        setupSearchDebounce() {
            // Create a debounced function that waits 500ms before triggering search
            this.debouncedSearch = debounce((query) => {
                this.setSearchQueryDebounced(query)
            }, 500)
        },
    },
})
