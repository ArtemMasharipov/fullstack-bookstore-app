import { BOOKS, UI } from '../types'
import * as booksApi from '@/api/booksApi'

export default {
    namespaced: true,
    state: () => ({
        list: [],
        current: null,
        loading: false,
        error: null,
    }),

    getters: {
        booksList: (state) => state.list,
        currentBook: (state) => state.current,
        booksLoading: (state) => state.loading,
        booksError: (state) => state.error,
    },

    mutations: {
        [BOOKS.SET_BOOKS](state, books) {
            state.list = books
        },
        [BOOKS.SET_CURRENT](state, book) {
            state.current = book
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        },
    },

    actions: {
        async fetchBooks({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const books = await booksApi.fetchBooks()
                commit(BOOKS.SET_BOOKS, books)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async fetchBookById({ commit }, id) {
            commit(UI.SET_LOADING, true)
            try {
                const book = await booksApi.fetchBookDetails(id)
                commit(BOOKS.SET_CURRENT, book)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async createBook({ commit, dispatch }, bookData) {
            commit(UI.SET_LOADING, true)
            try {
                await booksApi.createBook(bookData)
                await dispatch('fetchBooks')
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateBook({ commit, dispatch }, bookData) {
            commit(UI.SET_LOADING, true)
            try {
                await booksApi.updateBook(bookData)
                await dispatch('fetchBooks')
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    },
}
