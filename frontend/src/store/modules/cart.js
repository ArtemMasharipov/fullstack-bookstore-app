import { CART, UI } from '../types'
import {cartApi} from '@/api/cartApi'

export default {
    namespaced: true,
    state: () => ({
        items: JSON.parse(localStorage.getItem('cart')) || [],
        loading: false,
        error: null,
    }),

    getters: {
        cartItems: (state) => state.items,
        cartLoading: (state) => state.loading,
        cartError: (state) => state.error,
        cartTotal: (state) => {
            return state.items.reduce((total, item) => {
                return total + item.price * item.quantity
            }, 0)
        },
        itemCount: (state) => {
            return state.items.reduce((count, item) => count + item.quantity, 0)
        },
    },
    mutations: {
        [CART.SET_ITEMS](state, items) {
            state.items = items
            localStorage.setItem('cart', JSON.stringify(items))
        },
        [CART.ADD_ITEM](state, item) {
            const existingItem = state.items.find((i) => i.id === item.id)
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
        [CART.UPDATE_QUANTITY](state, { id, quantity }) {
            const item = state.items.find((i) => i.id === id)
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

        async addToCart({ commit, state }, item) {
            commit(UI.SET_LOADING, true)
            try {
                if (state.user) {
                    const updatedCart = await cartApi.addToCart(item)
                    commit(CART.SET_ITEMS, updatedCart)
                } else {
                    commit(CART.ADD_ITEM, item)
                }
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async removeFromCart({ commit, state }, itemId) {
            commit(UI.SET_LOADING, true)
            try {
                if (state.user) {
                    const updatedCart = await cartApi.removeFromCart(itemId)
                    commit(CART.SET_ITEMS, updatedCart)
                } else {
                    commit(CART.REMOVE_ITEM, itemId)
                }
            } catch (error) {
                commit(UI.SET_ERROR, error)
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
                    commit(CART.UPDATE_QUANTITY, payload)
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
                const updatedCart = await cartApi.syncCart(localCart)
                commit(CART.SET_ITEMS, updatedCart)
                localStorage.removeItem('cart')
            } catch (error) {
                commit(UI.SET_ERROR, error)
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },
    }
}
