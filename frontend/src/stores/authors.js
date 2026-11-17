import { authorsApi } from '@/services/api/authorsApi'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

/**
 * Storefront reads only; each admin screen owns its list and write state. Only the newest list request sets the
 * list: with quick paging or typing, answers can arrive out of order. Its error is the API error object (its code is
 * translated on screen); it is thrown on as well.
 */
export const useAuthorsStore = defineStore('authors', {
    state: () => ({
        list: [],
        current: null,
        searchQuery: '',
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        loading: false,
        error: null,
        // The number of the newest list request: an older answer must not replace a newer one
        listRequest: 0,
    }),
    actions: {
        /** A page of authors: params are the GET /authors query (page, limit, sortBy, search) */
        async fetchAuthors(params) {
            const request = ++this.listRequest
            const latest = () => request === this.listRequest
            this.loading = true
            this.error = null
            try {
                const response = await authorsApi.fetchAll(params)
                if (latest()) {
                    this.list = response.data
                    const { page, limit, total, pages } = response.pagination
                    Object.assign(this, { page, limit, total, pages })
                }
                return response
            } catch (error) {
                if (latest()) this.error = error
                throw error
            } finally {
                if (latest()) this.loading = false
            }
        },
        async fetchAuthorById(id) {
            return withLoading(this, async () => {
                const { data } = await authorsApi.fetchById(id, { includeBooks: true })
                this.current = { ...data.author, books: data.books }
                return this.current
            })
        },
        setSearchQuery(query) {
            this.searchQuery = query
        },
        setError(message) {
            this.error = message
        },
    },
})
