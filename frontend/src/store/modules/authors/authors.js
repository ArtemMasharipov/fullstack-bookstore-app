import { authorsApi } from '@/services/api/authorsApi'
import { defineStore } from 'pinia'

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
        // Все простые getters удалены - используйте storeToRefs для прямого доступа к state
    },

    actions: {
        /**
         * Fetch all authors
         */
        async fetchAuthors() {
            this.loading = true
            this.error = null

            try {
                const authors = await authorsApi.fetchAll()
                this.list = Array.isArray(authors) ? authors : []
                return authors
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch author by ID
         */
        async fetchAuthorById(id) {
            this.loading = true
            this.error = null

            try {
                const author = await authorsApi.fetchById(id)
                this.current = author
                return author
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Create a new author
         */
        async createAuthor(authorData) {
            this.loading = true
            this.error = null

            try {
                const author = await authorsApi.create(authorData)
                this.list.push(author)
                this.total += 1
                return author
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update an existing author
         */
        async updateAuthor(authorData) {
            if (!authorData || !authorData.id) {
                throw new Error('Author ID is required for update')
            }

            this.loading = true
            this.error = null

            try {
                const id = authorData.id
                const author = await authorsApi.update(id, authorData)

                const index = this.list.findIndex((a) => a.id === id)
                if (index !== -1) {
                    this.list.splice(index, 1, author)
                }

                return author
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Delete an author
         */
        async deleteAuthor(authorId) {
            this.loading = true
            this.error = null

            try {
                await authorsApi.delete(authorId)
                this.list = this.list.filter((a) => a.id !== authorId)
                this.total = Math.max(0, this.total - 1)

                if (this.current && this.current.id === authorId) {
                    this.current = null
                }
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
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
