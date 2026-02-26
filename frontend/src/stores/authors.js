import { authorsApi } from '@/services/api/authorsApi'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

/**
 * Authors Store
 * Manages authors data and CRUD operations
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useAuthorsStore = defineStore('authors', {
    state: () => ({
        // Authors list
        list: [],
        current: null,

        // Search
        searchQuery: '',

        // Pagination
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,

        // Loading & error states
        loading: false,
        error: null,
    }),

    getters: {
        // All simple getters removed - use storeToRefs for direct state access
    },

    actions: {
        /**
         * Fetch all authors
         */
        async fetchAuthors() {
            return withLoading(this, async () => {
                const response = await authorsApi.fetchAll()
                const authors = response?.data ?? response
                this.list = Array.isArray(authors) ? authors : []
                return authors
            })
        },

        /**
         * Fetch author by ID
         */
        async fetchAuthorById(id) {
            return withLoading(this, async () => {
                const author = await authorsApi.fetchById(id)
                this.current = author
                return author
            })
        },

        /**
         * Create a new author
         */
        async createAuthor(authorData) {
            return withLoading(this, async () => {
                const author = await authorsApi.create(authorData)
                this.list.push(author)
                this.total += 1
                return author
            })
        },

        /**
         * Update an existing author
         */
        async updateAuthor(authorData) {
            if (!authorData || !authorData.id) {
                throw new Error('Author ID is required for update')
            }

            return withLoading(this, async () => {
                const id = authorData.id
                const author = await authorsApi.update(id, authorData)

                const index = this.list.findIndex((a) => a.id === id)
                if (index !== -1) {
                    this.list.splice(index, 1, author)
                }

                return author
            })
        },

        /**
         * Delete an author
         */
        async deleteAuthor(authorId) {
            return withLoading(this, async () => {
                await authorsApi.delete(authorId)
                this.list = this.list.filter((a) => a.id !== authorId)
                this.total = Math.max(0, this.total - 1)

                if (this.current && this.current.id === authorId) {
                    this.current = null
                }
            })
        },

        /**
         * Set search query
         */
        setSearchQuery(query) {
            this.searchQuery = query
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
