import { CART, UI } from '../types'
import {cartApi} from '@/api/cartApi'

const handleAction = async (commit, action) => {
    commit(UI.SET_LOADING, true)
    try {
        await action()
    } catch (error) {
        commit(UI.SET_ERROR, error?.message || 'Operation failed')
    } finally {
        commit(UI.SET_LOADING, false)
    }
}

export default {
    namespaced: true,
    state: () => ({
        items: JSON.parse(localStorage.getItem('cart')) || [],
        loading: false,
        error: null
    }),

    getters: {
        cartItems: (state) => state.items.map(({ _id, bookId, quantity, price }) => ({
            _id,
            bookId: {
                _id: bookId?._id || bookId,
                title: bookId?.title || 'Unknown Book',
                image: bookId?.image
            },
            quantity: Number(quantity),
            price: Number(price)
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
            state.items = items || []
            localStorage.setItem('cart', JSON.stringify(state.items))
        },
        [CART.ADD_ITEM](state, item) {
            const existingItem = state.items.find(
                i => i.bookId?._id === item.bookId?._id || i.bookId === item.bookId
            );
            if (existingItem) {
                existingItem.quantity += item.quantity;
            } else {
                state.items.push(item);
            }
            localStorage.setItem('cart', JSON.stringify(state.items));
        },
        [CART.REMOVE_ITEM](state, itemId) {
            state.items = state.items.filter(item => item._id !== itemId);
            localStorage.setItem('cart', JSON.stringify(state.items));
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
        }
    },

    actions: {
        [CART.FETCH_CART]({ commit }) {
            return handleAction(commit, async () => {
                const { items = [] } = await cartApi.fetchCart() || {}
                commit(CART.SET_ITEMS, items)
            })
        },
        
        async addToCart({ commit, rootGetters }, { bookId, quantity, price }) {
            return handleAction(commit, async () => {
                if (rootGetters['auth/isAuthenticated']) {
                    const { items } = await cartApi.addToCart({ bookId, quantity, price })
                    commit(CART.SET_ITEMS, items)
                } else {
                    commit(CART.ADD_ITEM, { bookId, quantity, price })
                }
            })
        },

        async removeFromCart({ commit }, itemId) {
            return handleAction(commit, async () => {
                const response = await cartApi.removeFromCart(itemId);
                commit(CART.SET_ITEMS, response.items);
            })
        },

        async updateQuantity({ commit, rootState }, payload) {
            return handleAction(commit, async () => {
                if (rootState.auth.isAuthenticated) {
                    const response = await cartApi.updateQuantity(payload.itemId, payload.quantity);
                    if (response && response.items) {
                        commit(CART.SET_ITEMS, response.items);
                    }
                } else {
                    commit(CART.UPDATE_QUANTITY, payload);
                }
            })
        },

        async clearCart({ commit }) {
            return handleAction(commit, async () => {
                await cartApi.clearCart()
                commit(CART.CLEAR)
            })
        },

        async [CART.SYNC_CART]({ commit }) {
            return handleAction(commit, async () => {
                const localCart = JSON.parse(localStorage.getItem('cart')) || [];
                const response = await cartApi.syncCart(localCart);
                
                if (response?.items) {
                    commit(CART.SET_ITEMS, response.items);
                    localStorage.removeItem('cart');
                } else {
                    throw new Error('Failed to sync cart');
                }
            })
        },
    }
}
