import { booksApi } from '@/services/api/booksApi'
import { normalizeApiResponse, normalizeBook, normalizeBooks } from '@/utils/dataNormalizers'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

/**
 * Books Store
 * A page of books with the server's pagination, the open book, and the admin's book changes. Search and filters
 * are not kept here: the catalogue reads them from its address (router/catalogQuery.js)
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useBooksStore = defineStore('books', {
    state: () => ({
        // Data state
        books: [],
        currentBook: null,
        // The open book has a state of its own: loading it leaves the catalogue list as it is
        currentBookLoading: false,
        currentBookError: null,

        // Pagination
        page: 1,
        limit: 12,
        total: 0,
        pages: 0,

        // Loading & error states
        loading: false,
        error: null,

        // The number of the latest list request: an older answer must not replace a newer one
        listRequest: 0,
    }),

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
         * Fetch the open book with its own loading and error. The error is the API error object; it is thrown on as
         * well.
         */
        async fetchBookById(id) {
            this.currentBookLoading = true
            this.currentBookError = null
            try {
                const book = normalizeBook(normalizeApiResponse(await booksApi.fetchById(id)).data)
                this.currentBook = book
                return book
            } catch (error) {
                this.currentBookError = error
                throw error
            } finally {
                this.currentBookLoading = false
            }
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
