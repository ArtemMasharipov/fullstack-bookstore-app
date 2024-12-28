import { AUTH, UI } from '../types'
import * as authApi from '@/api/authApi'
import * as usersApi from '@/api/usersApi'

export default {
    namespaced: true,
    state: () => ({
        user: null,
        token: localStorage.getItem('token'),
        loading: false,
        error: null,
        permissions: [],
    }),

    getters: {
        currentUser: (state) => state.user,
        authToken: (state) => state.token,
        authLoading: (state) => state.loading,
        authError: (state) => state.error,
        isAuthenticated: (state) => !!state.token,
        hasPermission: (state) => (permission) => state.permissions.includes(permission),
    },

    mutations: {
        [AUTH.SET_USER](state, user) {
            state.user = user
        },
        [AUTH.SET_TOKEN](state, token) {
            state.token = token
            localStorage.setItem('token', token)
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        },
        setPermissions(state, permissions) {
            state.permissions = permissions
        },
    },

    actions: {
        async login({ commit, dispatch }, credentials) {
            commit(UI.SET_LOADING, true)
            try {
                const { user, token } = await authApi.login(credentials)
                commit(AUTH.SET_USER, user)
                commit(AUTH.SET_TOKEN, token)
                const permissions = await usersApi.fetchUserPermissions()
                commit('setPermissions', permissions)
                await dispatch('cart/syncCart', null, { root: true })
                console.log('User logged in:', user) // Вывод объекта пользователя в консоль
                return user
            } catch (error) {
                commit(UI.SET_ERROR, error.message)
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async register({ commit }, userData) {
            commit(UI.SET_LOADING, true)
            try {
                const { user, token } = await authApi.register(userData)
                commit(AUTH.SET_USER, user)
                commit(AUTH.SET_TOKEN, token)
                console.log('User registered:', user) // Вывод объекта пользователя в консоль
                return user
            } catch (error) {
                commit(UI.SET_ERROR, error.message)
                console.error('Registration error:', error.response ? error.response.data : error.message) // Вывод ошибки в консоль
                throw error
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async logout({ commit }) {
            try {
                await authApi.logout()
            } finally {
                commit(AUTH.SET_USER, null)
                commit(AUTH.SET_TOKEN, null)
                commit('setPermissions', [])
                localStorage.removeItem('token')
            }
        },

        async fetchCurrentUser({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const user = await usersApi.fetchCurrentUser()
                commit(AUTH.SET_USER, user)
                const permissions = await usersApi.fetchUserPermissions()
                commit('setPermissions', permissions)
            } catch (error) {
                commit(UI.SET_ERROR, error.message)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    },
}
