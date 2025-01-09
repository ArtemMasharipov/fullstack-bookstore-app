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
            const index = state.list.findIndex(book => book._id === updated._id);
            if (index !== -1) state.list.splice(index, 1, updated);
        },
        [BOOKS.DELETE_BOOK]: (state, id) => {
            state.list = state.list.filter(book => book._id !== id);
        },
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

        async updateBook({ commit }, { id, formData }) {
            commit(UI.SET_LOADING, true);
            try {
                const updatedBook = await booksApi.update(id, formData);
                commit(BOOKS.UPDATE_BOOK, updatedBook);
                return updatedBook;
            } finally {
                commit(UI.SET_LOADING, false);
            }
        },

        async deleteBook({ commit }, id) {
            if (!id) throw new Error('Book ID is required');
            
            commit(UI.SET_LOADING, true);
            try {
                await booksApi.delete(id);
                commit(BOOKS.DELETE_BOOK, id);
            } finally {
                commit(UI.SET_LOADING, false);
            }
        }
    }
}
