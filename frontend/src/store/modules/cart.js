import { CART, UI } from '../types'
import {cartApi} from '@/api/cartApi'

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
            state.items = items || [];
            localStorage.setItem('cart', JSON.stringify(state.items));
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
        async [CART.FETCH_CART]({ commit }) {
            try {
                commit(UI.SET_LOADING, true)
                const { items = [] } = await cartApi.fetchCart() || {}
                commit(CART.SET_ITEMS, items)
            } catch (error) {
                commit(UI.SET_ERROR, error?.message || 'Failed to fetch cart')
                commit(CART.SET_ITEMS, [])
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async addToCart({ commit, rootGetters }, { bookId, quantity, price }) {
            commit(UI.SET_LOADING, true)
            
            try {
                const isAuthenticated = rootGetters['auth/isAuthenticated']
                if (isAuthenticated) {
                    const response = await cartApi.addToCart({ bookId, quantity, price })
                    if (response?.items) {
                        commit(CART.SET_ITEMS, response.items)
                    } else {
                        throw new Error('Invalid response structure')
                    }
                } else {
                    commit(CART.ADD_ITEM, { bookId, quantity, price })
                }
            } catch (error) {
                console.error('Add to cart error:', error)
                commit(UI.SET_ERROR, String(error.message || 'Failed to add item to cart'))
            } finally {
                commit(UI.SET_LOADING, false)
            }
        },

        async removeFromCart({ commit }, itemId) {
            commit(UI.SET_LOADING, true);
            try {
                const response = await cartApi.removeFromCart(itemId);
                commit(CART.SET_ITEMS, response.items);
            } catch (error) {
                commit(UI.SET_ERROR, 'Failed to remove item');
            } finally {
                commit(UI.SET_LOADING, false);
            }
        },

        async updateQuantity({ commit, rootState }, payload) {
            commit(UI.SET_LOADING, true);
            try {
                if (rootState.auth.isAuthenticated) {
                    const response = await cartApi.updateQuantity(payload.itemId, payload.quantity);
                    if (response && response.items) {
                        commit(CART.SET_ITEMS, response.items);
                    }
                } else {
                    commit(CART.UPDATE_QUANTITY, payload);
                }
            } catch (error) {
                commit(UI.SET_ERROR, String(error.message || 'Failed to update quantity'));
            } finally {
                commit(UI.SET_LOADING, false);
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

        async [CART.SYNC_CART]({ commit }) {
            commit(UI.SET_LOADING, true);
            try {
                const localCart = JSON.parse(localStorage.getItem('cart')) || [];
                const response = await cartApi.syncCart(localCart);
                
                if (response?.items) {
                    commit(CART.SET_ITEMS, response.items);
                    localStorage.removeItem('cart');
                } else {
                    throw new Error('Failed to sync cart');
                }
            } catch (error) {
                console.error('Sync cart error:', error);
                commit(UI.SET_ERROR, error.message || 'Failed to sync cart');
            } finally {
                commit(UI.SET_LOADING, false);
            }
        },
    }
}
