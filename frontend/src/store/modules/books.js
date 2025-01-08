import { BOOKS, UI } from '../types'
import { booksApi } from '@/api/booksApi'
import { handleAsyncAction } from '@/utils/stateHelpers'

export default {
    namespaced: true,
    state: () => ({
        list: [],
        current: null,
        loading: false,
        error: null
    }),

    getters: {
        booksList: state => state.list,
        currentBook: state => state.current,
        booksLoading: state => state.loading,
        booksError: state => state.error
    },

    mutations: {
        [BOOKS.SET_LIST]: (state, books) => state.list = books,
        [BOOKS.SET_CURRENT]: (state, book) => state.current = book,
        [BOOKS.ADD_BOOK]: (state, book) => state.list.push(book),
        [BOOKS.UPDATE_BOOK]: (state, updated) => {
            const index = state.list.findIndex(book => book.id === updated.id)
            if (index !== -1) state.list.splice(index, 1, updated)
        },
        [BOOKS.DELETE_BOOK]: (state, id) => state.list = state.list.filter(book => book.id !== id),
        [UI.SET_LOADING]: (state, loading) => state.loading = loading,
        [UI.SET_ERROR]: (state, error) => state.error = error
    },

    actions: {
        fetchBooks({ commit }) {
            return handleAsyncAction(commit, () => booksApi.fetchAll(), {
                onSuccess: books => commit(BOOKS.SET_LIST, books)
            })
        },

        fetchBookById({ commit }, id) {
            return handleAsyncAction(commit, () => booksApi.fetchById(id), {
                onSuccess: book => commit(BOOKS.SET_CURRENT, book)
            })
        },

        createBook({ commit }, formData) {
            return handleAsyncAction(commit, () => booksApi.create(formData), {
                onSuccess: book => commit(BOOKS.ADD_BOOK, book),
                loadingMutation: UI.SET_LOADING,
                errorMutation: UI.SET_ERROR
            })
        },

        updateBook({ commit, state }, { id, formData }) {
            const original = state.list.find(book => book.id === id)
            return handleAsyncAction(commit, () => booksApi.update(id, formData), {
                onSuccess: book => commit(BOOKS.UPDATE_BOOK, book),
                onError: () => commit(BOOKS.UPDATE_BOOK, original),
                loadingMutation: UI.SET_LOADING,
                errorMutation: UI.SET_ERROR
            })
        },

        deleteBook({ commit, state }, id) {
            const originalList = [...state.list]
            commit(BOOKS.DELETE_BOOK, id)
            return handleAsyncAction(commit, () => booksApi.delete(id), {
                onError: () => commit(BOOKS.SET_LIST, originalList)
            })
        }
    }
}
