import { AUTHORS, UI } from '../types'
import { authorsApi } from '@/api/authorsApi'
import { handleAsyncAction } from '@/utils/stateHelpers'

export default {
    namespaced: true,
    state: () => ({
        list: [],
        current: null,
        loading: false,
        error: null,
    }),

    getters: {
        authorsList: (state) => state.list,
        currentAuthor: (state) => state.current,
        authorsLoading: (state) => state.loading,
        authorsError: (state) => state.error,
    },

    mutations: {
        [AUTHORS.SET_LIST](state, authors) {
            state.list = authors
        },
        [AUTHORS.SET_CURRENT](state, author) {
            state.current = author
        },
        [AUTHORS.ADD_AUTHOR](state, author) {
            state.list.push(author)
        },
        [AUTHORS.UPDATE_AUTHOR](state, updatedAuthor) {
            const index = state.list.findIndex((author) => author._id === updatedAuthor._id)
            if (index !== -1) {
                state.list.splice(index, 1, updatedAuthor)
            }
        },
        [AUTHORS.DELETE_AUTHOR](state, authorId) {
            state.list = state.list.filter((author) => author._id !== authorId)
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error ? error.toString() : null
        },
    },

    actions: {
        async fetchAuthors({ commit }) {
            await handleAsyncAction(
                commit,
                async () => {
                    const authors = await authorsApi.fetchAll()
                    commit(AUTHORS.SET_LIST, authors)
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async createAuthor({ commit }, authorData) {
            commit(UI.SET_LOADING, true)
            try {
                const newAuthor = await authorsApi.create(authorData)
                commit(AUTHORS.ADD_AUTHOR, newAuthor)
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateAuthor({ commit }, authorData) {
            commit(UI.SET_LOADING, true)
            try {
                const updatedAuthor = await authorsApi.update(authorData._id, authorData)
                commit(AUTHORS.UPDATE_AUTHOR, updatedAuthor)
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
        async deleteAuthor({ commit }, authorId) {
            if (!authorId) {
                throw new Error('Author ID is required');
            }

            try {
                await authorsApi.delete(authorId);
                commit(AUTHORS.DELETE_AUTHOR, authorId);
                return true;
            } catch (error) {
                commit(UI.SET_ERROR, error.message);
                throw error;
            }
        },
    },
}
