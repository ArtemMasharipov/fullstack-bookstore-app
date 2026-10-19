import { authorsApi } from '@/services/api/authorsApi'
import { defineStore } from 'pinia'
import { withLoading } from './storeHelpers'

/** Storefront reads only; each admin screen owns its list and write state. */
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
    }),
    actions: {
        async fetchAuthors() {
            return withLoading(this, async () => {
                const response = await authorsApi.fetchAll()
                this.list = response.data
                const { page, limit, total, pages } = response.pagination
                Object.assign(this, { page, limit, total, pages })
                return this.list
            })
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
        clearError() {
            this.error = null
        },
    },
})
