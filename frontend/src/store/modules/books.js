import { BOOKS, UI } from '../types'
import { booksApi } from '@/api/booksApi'

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
        [BOOKS.SET_LIST](state, books) {
            state.list = books
        },
        [BOOKS.SET_CURRENT](state, book) {
            state.current = book
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error ? error.toString() : null
        },
    },

    actions: {
        async fetchBooks({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const books = await booksApi.fetchAll()
                commit(BOOKS.SET_LIST, books)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async fetchBookById({ commit }, id) {
            commit(UI.SET_LOADING, true)
            try {
                const book = await booksApi.fetchById(id)
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
                await booksApi.create(bookData)
                console.log('Book created successfully')
                await dispatch('fetchBooks')
            } catch (error) {
                console.error('Vuex Store - Create Book Error:', error)
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateBook({ commit, dispatch }, bookData) {
            commit(UI.SET_LOADING, true)
            try {
                await booksApi.update(bookData.id, bookData)
                await dispatch('fetchBooks')
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async deleteBook({ commit, dispatch }, bookId) {
            commit(UI.SET_LOADING, true)
            try {
                await booksApi.delete(bookId)
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
