import { ORDER, UI } from '../types'
import { orderApi } from '@/api/orderApi'
import { handleAsyncAction } from '@/utils/stateHelpers'

export default {
    namespaced: true,
    state: () => ({
        orders: [],
        currentOrder: null,
        loading: false,
        error: null
    }),

    getters: {
        ordersList: state => state.orders,
        currentOrder: state => state.currentOrder,
        loading: state => state.loading,
        error: state => state.error
    },

    mutations: {
        [ORDER.SET_ORDERS](state, orders) {
            state.orders = orders
        },
        [ORDER.SET_CURRENT](state, order) {
            state.currentOrder = order
        },
        [ORDER.ADD_ORDER](state, order) {
            state.orders.unshift(order)
        },
        [ORDER.UPDATE_STATUS](state, { id, status }) {
            const order = state.orders.find(o => o._id === id)
            if (order) order.status = status
        },
        [UI.SET_LOADING](state, loading) {
            state.loading = loading
        },
        [UI.SET_ERROR](state, error) {
            state.error = error
        }
    },

    actions: {
        async createOrder({ commit, dispatch }, orderData) {
            return handleAsyncAction(
                commit,
                async () => {
                    const order = await orderApi.createOrder(orderData)
                    commit(ORDER.ADD_ORDER, order)
                    await dispatch('cart/clearCart', null, { root: true })
                    return order
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async fetchOrders({ commit }) {
            return handleAsyncAction(
                commit,
                async () => {
                    const orders = await orderApi.getOrders()
                    commit(ORDER.SET_ORDERS, orders)
                    return orders
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async fetchOrderById({ commit }, id) {
            return handleAsyncAction(
                commit,
                async () => {
                    const order = await orderApi.getOrderById(id)
                    commit(ORDER.SET_CURRENT, order)
                    return order
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async updateOrderStatus({ commit }, { id, status }) {
            return handleAsyncAction(
                commit,
                async () => {
                    const updatedOrder = await orderApi.updateOrderStatus(id, status)
                    commit(ORDER.UPDATE_STATUS, { id, status: updatedOrder.status })
                    return updatedOrder
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        },

        async cancelOrder({ commit }, id) {
            return handleAsyncAction(
                commit,
                async () => {
                    const updatedOrder = await orderApi.cancelOrder(id)
                    commit(ORDER.UPDATE_STATUS, { id, status: updatedOrder.status })
                    return updatedOrder
                },
                { setLoading: UI.SET_LOADING, setError: UI.SET_ERROR }
            )
        }
    }
}