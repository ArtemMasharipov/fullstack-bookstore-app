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
        [BOOKS.ADD_BOOK](state, book) {
            state.list.push(book)
        },
        [BOOKS.UPDATE_BOOK](state, updatedBook) {
            const index = state.list.findIndex(book => book.id === updatedBook.id)
            if (index !== -1) {
                state.list.splice(index, 1, updatedBook)
            }
        },
        [BOOKS.DELETE_BOOK](state, bookId) {
            state.list = state.list.filter(book => book.id !== bookId)
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

        async createBook({ commit }, bookData) {
            commit(UI.SET_LOADING, true)
            try {
                const newBook = await booksApi.create(bookData)
                commit(BOOKS.ADD_BOOK, newBook)
                console.log('Book created successfully')
            } catch (error) {
                console.error('Vuex Store - Create Book Error:', error)
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateBook({ commit, state }, bookData) {
            const originalBook = state.list.find(book => book.id === bookData.id)
            commit(BOOKS.UPDATE_BOOK, bookData)
            try {
                await booksApi.update(bookData.id, bookData)
            } catch (error) {
                commit(BOOKS.UPDATE_BOOK, originalBook)
                commit(UI.SET_ERROR, error)
                throw error
            }
        },

        async deleteBook({ commit, state }, bookId) {
            const originalList = [...state.list]
            commit(BOOKS.DELETE_BOOK, bookId)
            try {
                await booksApi.delete(bookId)
            } catch (error) {
                commit(BOOKS.SET_LIST, originalList)
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    },
}
