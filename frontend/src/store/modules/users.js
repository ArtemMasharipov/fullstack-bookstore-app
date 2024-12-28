import { USERS, UI } from '../types'
import * as usersApi from '@/api/usersApi';

export default {
    namespaced: true,
    state: () => ({
        list: [],
        current: null,
        loading: false,
        error: null,
    }),

    getters: {
        usersList: (state) => state.list,
        currentUser: (state) => state.current,
        usersLoading: (state) => state.loading,
        usersError: (state) => state.error,
        getUserById: (state) => (id) => {
            return state.list.find((user) => user.id === id)
        },
    },

    mutations: {
        [USERS.SET_LIST](state, users) {
            state.list = users
        },
        [USERS.SET_CURRENT](state, user) {
            state.current = user
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        },
    },

    actions: {
        async fetchUsers({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const users = await usersApi.fetchUsers()
                commit(USERS.SET_LIST, users)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async fetchUserById({ commit }, id) {
            commit(UI.SET_LOADING, true)
            try {
                const user = await usersApi.fetchUserDetails(id)
                commit(USERS.SET_CURRENT, user)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async createUser({ commit }, userData) {
            commit(UI.SET_LOADING, true)
            try {
                const user = await usersApi.createUser(userData)
                commit(USERS.SET_CURRENT, user)
                return user
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateUser({ commit }, { id, userData }) {
            commit(UI.SET_LOADING, true)
            try {
                const user = await usersApi.updateUser(id, userData)
                commit(USERS.SET_CURRENT, user)
                return user
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async deleteUser({ commit }, id) {
            commit(UI.SET_LOADING, true)
            try {
                await usersApi.deleteUser(id)
                commit(USERS.SET_CURRENT, null)
            } catch (error) {
                commit(UI.SET_ERROR, error)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    },
}
