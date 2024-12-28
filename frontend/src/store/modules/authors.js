import { AUTHORS, UI } from '../types'
import * as authorsApi from '@/api/authorsApi'

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
        [AUTHORS.SET_AUTHORS](state, authors) {
            state.list = authors
        },
        [AUTHORS.SET_CURRENT](state, author) {
            state.current = author
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        },
    },

    actions: {
        async fetchAuthors({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const authors = await authorsApi.fetchAuthors()
                commit(AUTHORS.SET_AUTHORS, authors)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async fetchAuthorById({ commit }, id) {
            commit(UI.SET_LOADING, true)
            try {
                const author = await authorsApi.fetchAuthorDetails(id)
                commit(AUTHORS.SET_CURRENT, author)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async createAuthor({ commit, dispatch }, authorData) {
            commit(UI.SET_LOADING, true)
            try {
                await authorsApi.createAuthor(authorData)
                await dispatch('fetchAuthors')
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateAuthor({ commit, dispatch }, authorData) {
            commit(UI.SET_LOADING, true)
            try {
                await authorsApi.updateAuthor(authorData)
                await dispatch('fetchAuthors')
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    },
}
