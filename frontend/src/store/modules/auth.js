import { AUTH, UI } from '../types'
import { authApi } from '@/api/authApi'
import { handleAsyncAction } from '@/utils/stateHelpers'
import {jwtDecode} from 'jwt-decode'

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
        isAuthenticated: (state) => !!state.token,
        hasPermission: (state) => (permission) => state.permissions.includes(permission),
        authLoading: state => state.loading,
        authError: state => state.error
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
            await handleAsyncAction(
                commit,
                async () => {
                    const { user, token } = await authApi.login(credentials)
                    commit(AUTH.SET_USER, user)
                    commit(AUTH.SET_TOKEN, token)
                    commit('setPermissions', user.permissions)
                    await dispatch('cart/syncCart', null, { root: true }) // Синхронизация корзины
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async register({ commit }, userData) {
            await handleAsyncAction(
                commit,
                async () => {
                    const { user, token } = await authApi.register(userData)
                    commit(AUTH.SET_USER, user)
                    commit(AUTH.SET_TOKEN, token)
                    commit('setPermissions', user.permissions)
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async logout({ commit }) {
            await handleAsyncAction(
                commit,
                async () => {
                    await authApi.logout();
                    commit(AUTH.SET_USER, null);
                    commit(AUTH.SET_TOKEN, null);
                    commit('setPermissions', []);
                    localStorage.removeItem('token');
                },
                { setLoading: UI.SET_LOADING }
            );
        },

        restoreUserFromToken({ commit }) {
            const token = localStorage.getItem('token')
            if (token) {
                try {
                    const decoded = jwtDecode(token)
                    commit(AUTH.SET_USER, decoded)
                    commit('setPermissions', decoded.permissions)
                } catch (error) {
                    console.error('Error decoding token:', error.message)
                    commit(AUTH.SET_USER, null)
                    commit('setPermissions', [])
                    localStorage.removeItem('token')
                }
            }
        },
    },
}
