import { booksApi } from '@/services/api/booksApi'
import { normalizeApiResponse, normalizeBook, normalizeBooks } from '@/utils/dataNormalizers'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

let _searchTimer = null

/**
 * Books Store
 * Manages books data, search, filtering, and pagination
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useBooksStore = defineStore('books', {
    state: () => ({
        // Data state
        books: [],
        currentBook: null,

        // Pagination
        page: 1,
        limit: 12,
        total: 0,
        pages: 0,

        // Filter parameters
        searchQuery: '',
        category: null,
        authorId: null,

        // Loading & error states
        loading: false,
        searching: false,
        error: null,
    }),

    getters: {
        /**
         * Get filter parameters for API request
         */
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

    actions: {
        /**
         * Fetch books with pagination
         * Simplified with withLoading helper
         */
        async fetchBooks(params = { page: 1, limit: 12 }) {
            return withLoading(this, async () => {
                const response = await booksApi.fetchAll(params)
                this.setBooksList(response)
                return response
            })
        },

        /**
         * Fetch book by ID
         * Simplified with withLoading helper
         */
        async fetchBookById(id) {
            return withLoading(this, async () => {
                const book = await booksApi.fetchById(id)
                this.currentBook = book
                return book
            })
        },

        /**
         * Create a new book
         */
        async createBook(formData) {
            return withLoading(this, async () => {
                const response = await booksApi.create(formData)
                const normalizedResponse = normalizeApiResponse(response)
                const book = normalizeBook(normalizedResponse.data)

                if (book) {
                    this.books.push(book)
                    this.total += 1
                }

                return book
            })
        },

        /**
         * Update an existing book
         */
        async updateBook({ id, formData }) {
            return withLoading(this, async () => {
                const response = await booksApi.update(id, formData)
                const normalizedResponse = normalizeApiResponse(response)
                const updatedBook = normalizeBook(normalizedResponse.data)

                if (updatedBook) {
                    const index = this.books.findIndex((book) => book.id === updatedBook.id)
                    if (index !== -1) {
                        this.books.splice(index, 1, updatedBook)
                    }
                }

                return updatedBook
            })
        },

        /**
         * Delete a book
         */
        async deleteBook(id, title = '') {
            if (!id) throw new Error('Book ID is required')

            return withLoading(this, async () => {
                if (!title) {
                    const book = this.books.find((b) => b.id === id)
                    title = book?.title || 'Book'
                }

                await booksApi.delete(id)
                this.books = this.books.filter((book) => book.id !== id)
                this.total = Math.max(0, this.total - 1)
            })
        },

        /**
         * Helper method to handle different API response formats
         */
        setBooksList(response) {
            const normalizedResponse = normalizeApiResponse(response)

            if (Array.isArray(normalizedResponse.data)) {
                this.books = normalizeBooks(normalizedResponse.data)
                this.page = 1
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
                    this.total = this.books.length
                    this.pages = 1
                }
            } else {
                this.books = []
                this.page = 1
                this.limit = 12
                this.total = 0
                this.pages = 0
            }
        },

        /**
         * Set search query
         */
        setSearchQuery(query) {
            this.searchQuery = query
            this.page = 1
        },

        /**
         * Debounced search (to be called from components)
         * Minimum 2 characters to trigger search, empty clears filter
         */
        debouncedSearch(query) {
            clearTimeout(_searchTimer)
            const trimmed = query?.trim() ?? ''

            if (!trimmed) {
                this.setSearchQuery('')
                this.loadBooks()
                return
            }

            if (trimmed.length < 2) return

            this.setSearchQuery(trimmed)
            _searchTimer = setTimeout(async () => {
                this.searching = true
                try {
                    await this.fetchBooks(this.filterParams)
                } finally {
                    this.searching = false
                }
            }, 300)
        },

        /**
         * Set category filter
         */
        setCategory(category) {
            this.category = category
            this.page = 1
        },

        /**
         * Set author filter
         */
        setAuthorId(authorId) {
            this.authorId = authorId
            this.page = 1
        },

        /**
         * Change page
         */
        changePage(page) {
            this.page = page
            return this.loadBooks()
        },

        /**
         * Load books with current filters
         */
        async loadBooks() {
            try {
                await this.fetchBooks(this.filterParams)
            } catch (error) {
                if (!error.isAuthError && !error.isNetworkError) {
                    // Failed to load books
                }
            }
        },

        /**
         * Clear filters and reset
         */
        clearFilters() {
            this.searchQuery = ''
            this.category = null
            this.authorId = null
            this.page = 1
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
