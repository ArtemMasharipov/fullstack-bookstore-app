import { AUTHORS, UI } from '../types'
import { authorsApi } from '@/api/authorsApi'

const handleAction = async (commit, action, errorMessage) => {
    commit(UI.SET_LOADING, true)
    commit(UI.SET_ERROR, null)
    try {
        const result = await action()
        commit(UI.SET_LOADING, false)
        return result
    } catch (error) {
        commit(UI.SET_ERROR, error.message || errorMessage)
        commit(UI.SET_LOADING, false)
        throw error
    }
}

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
        fetchAuthors({ commit }) {
            return handleAction(
                commit,
                async () => {
                    const authors = await authorsApi.fetchAll()
                    commit(AUTHORS.SET_LIST, authors)
                    return authors
                },
                'Failed to fetch authors'
            )
        },

        createAuthor({ commit }, authorData) {
            return handleAction(
                commit,
                async () => {
                    const newAuthor = await authorsApi.create(authorData)
                    commit(AUTHORS.ADD_AUTHOR, newAuthor)
                    return newAuthor
                },
                'Failed to create author'
            )
        },

        updateAuthor({ commit }, authorData) {
            return handleAction(
                commit,
                async () => {
                    const updatedAuthor = await authorsApi.update(authorData._id, authorData)
                    commit(AUTHORS.UPDATE_AUTHOR, updatedAuthor)
                    return updatedAuthor
                },
                'Failed to update author'
            )
        },

        deleteAuthor({ commit }, authorId) {
            return handleAction(
                commit,
                async () => {
                    await authorsApi.delete(authorId)
                    commit(AUTHORS.DELETE_AUTHOR, authorId)
                    return true
                },
                'Failed to delete author'
            )
        },
    },
}
