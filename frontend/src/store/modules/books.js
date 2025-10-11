import { booksApi } from '@/services/api/booksApi'
import { handleAsyncAction } from '@/store/utils/stateHelpers'
import { createLoadingActions, createLoadingState, createPaginationActions, createPaginationGetters, createPaginationState } from '@/store/utils/storeHelpers'
import { normalizeApiResponse, normalizeBook, normalizeBooks } from '@/utils/dataNormalizers'
import { debounce } from '@/utils/helpers/debounce'
import { logger } from '@/utils/logger'
import { defineStore } from 'pinia'

/**
 * Books store - manages books data and UI state
 */
export const useBooksStore = defineStore('books', {
    state: () => ({
        // Data state
        books: [],
        currentBook: null,
        
        // UI state (simple)
        showForm: false,
        selectedBook: null,
        bookToDelete: null,
        formSubmitting: false,
        searchQuery: '',
        category: null,
        authorId: null,
        
        // Loading and pagination
        ...createLoadingState(),
        ...createPaginationState(),
    }),

    getters: {
        // Data getters
        booksList: (state) => state.books,
        booksPagination: (state) => ({
            page: state.page,
            limit: state.limit,
            total: state.total,
            pages: state.pages,
        }),
        currentBook: (state) => state.currentBook,
        booksLoading: (state) => state.loading,
        booksError: (state) => state.error,
        
        // UI getters
        showDeleteDialog: (state) => !!state.bookToDelete,
        filterParams: (state) => {
            const params = {
                page: state.page,
                limit: state.limit,
            }

            if (state.searchQuery) {
                params.search = state.searchQuery
            }

            if (state.category) {
                params.category = state.category
            }

            if (state.authorId) {
                params.author = state.authorId
            }

            return params
        },
        
        // Pagination getters
        ...createPaginationGetters(),
    },

    actions: {
        // Loading actions
        ...createLoadingActions(),
        
        // Pagination actions
        ...createPaginationActions(),

        /**
         * Fetch books with pagination
         * @param {Object} params - Query parameters
         * @returns {Promise} - Fetched books
         */
        async fetchBooks(params = { page: 1, limit: 10 }) {
            return handleAsyncAction(this, async () => {
                try {
                    const response = await booksApi.fetchAll(params)
                    this.setBooksList(response)
                    return response
                } catch (error) {
                    // Don't log auth errors as they're handled by the interceptor
                    if (!error.isAuthError && !error.isNetworkError) {
                        logger.error('Error fetching books', error, 'books-store')
                    }
                    throw error
                }
            })
        },

        /**
         * Fetch book by ID
         * @param {string} id - Book ID
         * @returns {Promise} - Book object
         */
        async fetchBookById(id) {
            return handleAsyncAction(this, async () => {
                const book = await booksApi.fetchById(id)
                this.currentBook = book
                return book
            })
        },

        /**
         * Create a new book
         * @param {Object|FormData} formData - Book data
         * @returns {Promise} - Created book
         */
        async createBook(formData) {
            return handleAsyncAction(
                this,
                async () => {
                    const response = await booksApi.create(formData)
                    const normalizedResponse = normalizeApiResponse(response)
                    const book = normalizeBook(normalizedResponse.data)

                    if (book) {
                        this.books.push(book)
                    }

                    return book
                },
                {
                    onError: () => {
                        // Error handling without toast notifications
                    },
                }
            )
        },

        /**
         * Update an existing book
         * @param {Object} params - Parameters object
         * @param {string} params.id - Book ID
         * @param {Object|FormData} params.formData - Updated book data
         * @returns {Promise} - Updated book
         */
        async updateBook({ id, formData }) {
            return handleAsyncAction(
                this,
                async () => {
                    const response = await booksApi.update(id, formData)
                    const normalizedResponse = normalizeApiResponse(response)
                    const updatedBook = normalizeBook(normalizedResponse.data)

                    if (updatedBook) {
                        const index = this.books.findIndex((book) => book._id === updatedBook._id)
                        if (index !== -1) {
                            this.books.splice(index, 1, updatedBook)
                        }
                    }

                    return updatedBook
                },
                {
                    onError: () => {
                        // Error handling without toast notifications
                    },
                }
            )
        },

        /**
         * Delete a book
         * @param {string} id - Book ID
         * @param {string} title - Book title for notification (optional)
         */
        async deleteBook(id, title = '') {
            if (!id) throw new Error('Book ID is required')

            return handleAsyncAction(
                this,
                async () => {
                    // Find book title if not provided
                    if (!title) {
                        const book = this.books.find((b) => b._id === id)
                        title = book?.title || 'Book'
                    }

                    await booksApi.delete(id)
                    this.books = this.books.filter((book) => book._id !== id)
                },
                {
                    onError: () => {
                        // Error handling without toast notifications
                    },
                }
            )
        },

        /**
         * Helper method to handle different API response formats
         * @param {Array|Object} response - API response
         */
        setBooksList(response) {
            const normalizedResponse = normalizeApiResponse(response)
            
            if (Array.isArray(normalizedResponse.data)) {
                this.books = normalizeBooks(normalizedResponse.data)
                this.page = 1
                this.limit = this.books.length
                this.total = this.books.length
                this.pages = 1
            } else if (normalizedResponse.data && typeof normalizedResponse.data === 'object') {
                const books = normalizedResponse.data.books || normalizedResponse.data.data || []
                this.books = normalizeBooks(books)
                
                if (normalizedResponse.pagination) {
                    this.page = normalizedResponse.pagination.page
                    this.limit = normalizedResponse.pagination.limit
                    this.total = normalizedResponse.pagination.total
                    this.pages = normalizedResponse.pagination.pages
                } else {
                    this.page = 1
                    this.limit = this.books.length
                    this.total = this.books.length
                    this.pages = 1
                }
            } else {
                this.books = []
                this.page = 1
                this.limit = 10
                this.total = 0
                this.pages = 1
            }
        },

        // UI Actions
        /**
         * Initialize with filter options
         */
        initialize({ category = null, authorId = null, itemsPerPage = 12 }) {
            this.category = category
            this.authorId = authorId
            this.limit = itemsPerPage
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
            try {
                this.formSubmitting = true

                if (bookData._id) {
                    await this.updateBook({ id: bookData._id, formData: bookData.formData })
                } else {
                    await this.createBook(bookData.formData)
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
        async deleteBookFromUI() {
            if (!this.bookToDelete?._id) return

            try {
                await this.deleteBook(this.bookToDelete._id)
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
            this.page = page
            this.loadBooks()
        },

        /**
         * Set search query with debounce
         */
        setSearchQueryDebounced(query) {
            this.searchQuery = query
            // Reset to page 1 on search
            this.page = 1
            this.loadBooks()
        },

        /**
         * Load books with current filters
         */
        async loadBooks() {
            try {
                await this.fetchBooks(this.filterParams)
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (!error.isAuthError && !error.isNetworkError) {
                    // Error handling without toast notifications
                    console.warn('Failed to load books:', error.message)
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
