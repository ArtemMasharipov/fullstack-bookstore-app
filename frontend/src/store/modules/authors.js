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
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
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

        async createAuthor({ commit, state }, authorData) {
            await handleAsyncAction(
                commit,
                async () => {
                    const newAuthor = await authorsApi.create(authorData)
                    commit(AUTHORS.SET_LIST, [...state.list, newAuthor])
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async updateAuthor({ commit, state }, authorData) {
            await handleAsyncAction(
                commit,
                async () => {
                    const updatedAuthor = await authorsApi.update(authorData.id, authorData)
                    const updatedList = state.list.map((author) =>
                        author.id === authorData.id ? updatedAuthor : author
                    )
                    commit(AUTHORS.SET_LIST, updatedList)
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async deleteAuthor({ commit, state }, authorId) {
            await handleAsyncAction(
                commit,
                async () => {
                    await authorsApi.delete(authorId)
                    const updatedList = state.list.filter((author) => author.id !== authorId)
                    commit(AUTHORS.SET_LIST, updatedList)
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },
    },
}
