import { CART, UI } from '../types'
import {cartApi} from '@/api/cartApi'

export default {
    namespaced: true,
    state: () => ({
        items: [],
        loading: false,
        error: null,
    }),

    getters: {
        cartItems: (state) => state.items.map(item => ({
            bookId: {
                _id: item.bookId?._id || item.bookId,
                title: item.bookId?.title || 'Unknown Book',
                image: item.bookId?.image || null
            },
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0
        })),
        cartLoading: (state) => state.loading,
        cartError: (state) => state.error,
        cartTotal: (state) => {
            return state.items.reduce((total, item) => {
                return total + item.price * item.quantity
            }, 0)
        },
        itemCount: (state) => state.items.length,
    },
    mutations: {
        [CART.SET_ITEMS](state, items) {
            state.items = items
            localStorage.setItem('cart', JSON.stringify(items))
        },
        [CART.ADD_ITEM](state, item) {
            const existingItem = state.items.find((i) => i.bookId === item.bookId)
            if (existingItem) {
                existingItem.quantity += item.quantity
            } else {
                state.items.push(item)
            }
            localStorage.setItem('cart', JSON.stringify(state.items))
        },
        [CART.REMOVE_ITEM](state, itemId) {
            state.items = state.items.filter((item) => item.id !== itemId)
            localStorage.setItem('cart', JSON.stringify(state.items))
        },
        [CART.UPDATE_QUANTITY](state, { bookId, quantity }) {
            const item = state.items.find((i) => i.bookId === bookId)
            if (item) {
                item.quantity = quantity
            }
            localStorage.setItem('cart', JSON.stringify(state.items))
        },
        [CART.CLEAR](state) {
            state.items = []
            localStorage.removeItem('cart')
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        },
    },

    actions: {
        async fetchCart({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const items = await cartApi.fetchCart()
                commit(CART.SET_ITEMS, items)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async addToCart({ commit, rootState }, { bookId, quantity, price }) {
            commit(UI.SET_LOADING, true)
            try {
                if (rootState.auth.isAuthenticated) {
                    const response = await cartApi.addToCart({ bookId, quantity, price })
                    commit(CART.SET_ITEMS, response.data.items)
                } else {
                    commit(CART.ADD_ITEM, { bookId, quantity, price })
                }
            } catch (error) {
                commit(UI.SET_ERROR, error.message)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async removeFromCart({ commit, rootState }, itemId) {
            commit(UI.SET_LOADING, true)
            try {
                if (rootState.auth.isAuthenticated) {
                    const response = await cartApi.removeFromCart(itemId)
                    commit(CART.SET_ITEMS, response.data.items)
                } else {
                    commit(CART.REMOVE_ITEM, itemId)
                }
            } catch (error) {
                commit(UI.SET_ERROR, error.message)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async updateQuantity({ commit, state }, payload) {
            commit(UI.SET_LOADING, true)
            try {
                if (state.user) {
                    const updatedCart = await cartApi.updateQuantity(payload)
                    commit(CART.SET_ITEMS, updatedCart)
                } else {
                    const response = await cartApi.updateQuantity(payload)
                    commit(CART.UPDATE_QUANTITY, payload)
                    return response.data
                }
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async clearCart({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                await cartApi.clearCart()
                commit(CART.CLEAR)
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async syncCart({ commit }) {
            commit(UI.SET_LOADING, true)
            try {
                const localCart = JSON.parse(localStorage.getItem('cart')) || []
                const response = await cartApi.syncCart(localCart)
                commit(CART.SET_ITEMS, response.data.items || [])
                localStorage.removeItem('cart')
            } catch (error) {
                commit(UI.SET_ERROR, error.message || 'Failed to sync cart')
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    }
}
