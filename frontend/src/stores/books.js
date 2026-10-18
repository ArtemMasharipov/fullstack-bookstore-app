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

        // The number of the latest list request: an older answer must not replace a newer one
        listRequest: 0,
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
         * Fetch a page of books. Only the latest request sets the list, loading and the error: with quick Back,
         * Forward or typing, answers can arrive out of order. The error is the API error object (its code is
         * translated on screen); it is thrown on as well.
         */
        async fetchBooks(params = { page: 1, limit: 12 }) {
            const request = ++this.listRequest
            const latest = () => request === this.listRequest
            this.loading = true
            this.error = null
            try {
                const response = await booksApi.fetchAll(params)
                if (latest()) this.setBooksList(response)
                return response
            } catch (error) {
                if (latest()) this.error = error
                throw error
            } finally {
                if (latest()) this.loading = false
            }
        },

        /**
         * The newest books, for a list of its own (the home page): the catalogue's list and pages stay as they are
         */
        async fetchLatest(limit = 4) {
            const response = await booksApi.fetchAll({ page: 1, limit })
            return normalizeBooks(normalizeApiResponse(response).data)
        },

        /**
         * Fetch book by ID
         * Simplified with withLoading helper
         */
        async fetchBookById(id) {
            return withLoading(this, async () => {
                const response = await booksApi.fetchById(id)
                const normalizedResponse = normalizeApiResponse(response)
                const book = normalizeBook(normalizedResponse.data)
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
         * Keep a page of books with the server's pagination: { data: [...], pagination: { page, limit, total,
         * pages } }
         */
        setBooksList(response) {
            const { data, pagination } = normalizeApiResponse(response)
            this.books = normalizeBooks(data)
            this.page = pagination.page
            this.limit = pagination.limit
            this.total = pagination.total
            this.pages = pagination.pages
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
