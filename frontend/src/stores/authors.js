import { authorsApi } from '@/services/api/authorsApi'
import { defineStore } from 'pinia'

/**
 * Storefront reads only; each admin screen owns its list and write state. The list and the open author load apart,
 * each with its own loading and error. Only the newest request of each sets its state: with quick paging, typing or
 * a switch to another author, answers can arrive out of order. An error is the API error object (its code is
 * translated on screen); it is thrown on as well.
 */
export const useAuthorsStore = defineStore('authors', {
    state: () => ({
        list: [],
        current: null,
        // The open author has a state of its own: loading it leaves the list as it is
        currentLoading: false,
        currentError: null,
        searchQuery: '',
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        loading: false,
        error: null,
        // The numbers of the newest requests: an older answer must not replace a newer one
        listRequest: 0,
        currentRequest: 0,
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
        /** The open author with their books; a switch to another author makes the older answer stale */
        async fetchAuthorById(id) {
            const request = ++this.currentRequest
            const latest = () => request === this.currentRequest
            this.currentLoading = true
            this.currentError = null
            try {
                const { data } = await authorsApi.fetchById(id, { includeBooks: true })
                const author = { ...data.author, books: data.books }
                if (latest()) this.current = author
                return author
            } catch (error) {
                if (latest()) this.currentError = error
                throw error
            } finally {
                if (latest()) this.currentLoading = false
            }
        },
        setSearchQuery(query) {
            this.searchQuery = query
        },
        setError(message) {
            this.error = message
        },
    },
})
