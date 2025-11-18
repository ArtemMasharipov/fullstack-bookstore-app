import { useNotifications } from '@/composables/useNotifications'
import { orderApi } from '@/services/api/orderApi'
import { useCartStore } from '@/stores'
import { defineStore } from 'pinia'

/**
 * Orders Store
 * Manages orders data and operations
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useOrdersStore = defineStore('orders', {
    state: () => ({
        // Orders list
        orders: [],
        currentOrder: null,

        // Loading & error states
        loading: false,
        error: null,
    }),

    getters: {
        /**
         * Get orders list
         */
        ordersList: (state) => state.orders,

        /**
         * Get current order
         */
        getOrder: (state) => state.currentOrder,

        /**
         * Check loading state
         */
        ordersLoading: (state) => state.loading,

        /**
         * Get error message
         */
        ordersError: (state) => state.error,
    },

    actions: {
        /**
         * Create a new order and clear the cart after success
         * @param {Object} orderData - Data for the new order
         */
        async createOrder(orderData) {
            this.loading = true
            this.error = null

            try {
                const order = await orderApi.createOrder(orderData)

                // Add to the beginning of the list
                this.orders.unshift(order)

                // Clear the cart after order is created
                const cartStore = useCartStore()
                await cartStore.clearCart()

                // Show success notification
                const { showSuccess } = useNotifications()
                showSuccess(`Order #${order._id || order.id || 'New'} placed successfully!`, {
                    sound: 'success',
                    icon: 'mdi-check-circle',
                })

                return order
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch all orders
         */
        async fetchOrders() {
            this.loading = true
            this.error = null

            try {
                const orders = await orderApi.getOrders()
                this.orders = Array.isArray(orders) ? orders : []
                return orders
            } catch (error) {
                this.error = error.message
                this.orders = []
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Fetch order by ID
         * @param {string} id - Order ID
         */
        async fetchOrderById(id) {
            this.loading = true
            this.error = null

            try {
                const order = await orderApi.getOrderById(id)
                this.currentOrder = order
                return order
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update order status - domain-specific action
         * @param {Object} params - Parameters object
         * @param {string} params.id - Order ID
         * @param {string} params.status - New status
         */
        async updateOrderStatus({ id, status }) {
            this.loading = true
            this.error = null

            try {
                const updatedOrder = await orderApi.updateOrderStatus(id, status)

                // Update the order in our list
                const orderIndex = this.orders.findIndex((o) => o._id === id)
                if (orderIndex !== -1) {
                    this.orders[orderIndex].status = updatedOrder.status
                }

                // Update current order if it's the same
                if (this.currentOrder && this.currentOrder._id === id) {
                    this.currentOrder.status = updatedOrder.status
                }

                // Notify user
                const { showSuccess } = useNotifications()
                showSuccess(`Order #${id} status updated to "${status}"`, {
                    sound: 'success',
                    icon: 'mdi-clipboard-check',
                })

                return updatedOrder
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Cancel an order - domain-specific action
         * @param {string} id - Order ID
         */
        async cancelOrder(id) {
            this.loading = true
            this.error = null

            try {
                const updatedOrder = await orderApi.cancelOrder(id)

                // Update the order in our list
                const orderIndex = this.orders.findIndex((o) => o._id === id)
                if (orderIndex !== -1) {
                    this.orders[orderIndex].status = updatedOrder.status
                }

                // Update current order if it's the same
                if (this.currentOrder && this.currentOrder._id === id) {
                    this.currentOrder.status = updatedOrder.status
                }

                // Notify user
                const { showWarning } = useNotifications()
                showWarning(`Order #${id} has been cancelled`, {
                    sound: 'warning',
                    icon: 'mdi-cancel',
                })

                return updatedOrder
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Set error message
         */
        setError(message) {
            this.error = message
        },

        /**
         * Clear error message
         */
        clearError() {
            this.error = null
        },
    },
})


