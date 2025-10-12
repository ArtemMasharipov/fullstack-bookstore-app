import { booksApi } from '@/services/api/booksApi'
import { createBaseStore } from '@/store/utils/storeFactory'
import { normalizeApiResponse, normalizeBook, normalizeBooks } from '@/utils/dataNormalizers'
import { logger } from '@/utils/logger'

/**
 * Books store - manages books data only (UI state moved to components)
 * Uses storeFactory with TTL caching for better performance
 */
export const useBooksStore = createBaseStore({
    id: 'books',
    api: booksApi,
    cacheTTL: 60000, // 60 seconds cache

    // Custom state specific to books store
    customState: () => ({
        // Data state only
        books: [],
        currentBook: null,

        // Filter parameters (not UI state, but query parameters)
        searchQuery: '',
        category: null,
        authorId: null,
    }),

    // Custom getters specific to books store
    customGetters: {
        // Data getters
        booksList: (state) => state.books,
        booksPagination: (state) => ({
            page: state.page,
            limit: state.limit,
            total: state.total,
            pages: state.pages,
        }),
        booksLoading: (state) => state.loading,
        booksError: (state) => state.error,

        // Filter parameters getter
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
    },

    // Custom actions specific to books store
    customActions: {
        /**
         * Fetch books with pagination and caching
         * @param {Object} params - Query parameters
         * @returns {Promise} - Fetched books
         */
        async fetchBooks(params = { page: 1, limit: 10 }) {
            try {
                const response = await this.fetchAll(params)
                this.setBooksList(response)
                return response
            } catch (error) {
                // Don't log auth errors as they're handled by the interceptor
                if (!error.isAuthError && !error.isNetworkError) {
                    logger.error('Error fetching books', error, 'books-store')
                }
                throw error
            }
        },

        /**
         * Fetch book by ID
         * @param {string} id - Book ID
         * @returns {Promise} - Book object
         */
        async fetchBookById(id) {
            try {
                const book = await this.fetchById(id)
                this.currentBook = book
                return book
            } catch (error) {
                logger.error('Error fetching book by ID', error, 'books-store')
                throw error
            }
        },

        /**
         * Create a new book
         * @param {Object|FormData} formData - Book data
         * @returns {Promise} - Created book
         */
        async createBook(formData) {
            try {
                const response = await booksApi.create(formData)
                const normalizedResponse = normalizeApiResponse(response)
                const book = normalizeBook(normalizedResponse.data)

                if (book) {
                    this.books.push(book)
                }

                // Invalidate cache after creating
                this.invalidateCache()
                return book
            } catch (error) {
                logger.error('Error creating book', error, 'books-store')
                throw error
            }
        },

        /**
         * Update an existing book
         * @param {Object} params - Parameters object
         * @param {string} params.id - Book ID
         * @param {Object|FormData} params.formData - Updated book data
         * @returns {Promise} - Updated book
         */
        async updateBook({ id, formData }) {
            try {
                const response = await booksApi.update(id, formData)
                const normalizedResponse = normalizeApiResponse(response)
                const updatedBook = normalizeBook(normalizedResponse.data)

                if (updatedBook) {
                    const index = this.books.findIndex((book) => book._id === updatedBook._id)
                    if (index !== -1) {
                        this.books.splice(index, 1, updatedBook)
                    }
                }

                // Invalidate cache after updating
                this.invalidateCache()
                return updatedBook
            } catch (error) {
                logger.error('Error updating book', error, 'books-store')
                throw error
            }
        },

        /**
         * Delete a book
         * @param {string} id - Book ID
         * @param {string} title - Book title for notification (optional)
         */
        async deleteBook(id, title = '') {
            if (!id) throw new Error('Book ID is required')

            try {
                // Find book title if not provided
                if (!title) {
                    const book = this.books.find((b) => b._id === id)
                    title = book?.title || 'Book'
                }

                await booksApi.delete(id)
                this.books = this.books.filter((book) => book._id !== id)

                // Invalidate cache after deleting
                this.invalidateCache()
            } catch (error) {
                logger.error('Error deleting book', error, 'books-store')
                throw error
            }
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

        /**
         * Initialize with filter options
         */
        initialize({ category = null, authorId = null, itemsPerPage = 12 }) {
            this.category = category
            this.authorId = authorId
            this.limit = itemsPerPage
        },

        /**
         * Set search query
         */
        setSearchQuery(query) {
            this.searchQuery = query
            this.page = 1 // Reset to page 1 on search
        },

        /**
         * Set category filter
         */
        setCategory(category) {
            this.category = category
            this.page = 1 // Reset to page 1 on filter change
        },

        /**
         * Set author filter
         */
        setAuthorId(authorId) {
            this.authorId = authorId
            this.page = 1 // Reset to page 1 on filter change
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
                    console.warn('Failed to load books:', error.message)
                }
            }
        },
    },
})
