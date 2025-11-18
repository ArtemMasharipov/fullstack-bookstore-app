import { useNotifications } from '@/composables/useNotifications'
import { orderApi } from '@/services/api/orderApi'
import { useCartStore } from '@/stores'
import { withLoading } from './storeHelpers'
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
        // All removed - use storeToRefs for direct state access
    },

    actions: {
        /**
         * Create a new order and clear the cart after success
         * @param {Object} orderData - Data for the new order
         */
        async createOrder(orderData) {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
                const order = await orderApi.createOrder(orderData)

                // Add to the beginning of the list
                this.orders.unshift(order)

                // Clear the cart after order is created
                const cartStore = useCartStore()
                await cartStore.clearCart()

                // Show success notification
                showSuccess(`Order #${order._id || order.id || 'New'} placed successfully!`, {
                    sound: 'success',
                    icon: 'mdi-check-circle',
                })

                return order
            })
        },

        /**
         * Fetch all orders
         */
        async fetchOrders() {
            return withLoading(this, async () => {
                const orders = await orderApi.getOrders()
                this.orders = Array.isArray(orders) ? orders : []
                return orders
            })
        },

        /**
         * Fetch order by ID
         * @param {string} id - Order ID
         */
        async fetchOrderById(id) {
            return withLoading(this, async () => {
                const order = await orderApi.getOrderById(id)
                this.currentOrder = order
                return order
            })
        },

        /**
         * Update order status - domain-specific action
         * @param {Object} params - Parameters object
         * @param {string} params.id - Order ID
         * @param {string} params.status - New status
         */
        async updateOrderStatus({ id, status }) {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
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
                showSuccess(`Order #${id} status updated to "${status}"`, {
                    sound: 'success',
                    icon: 'mdi-clipboard-check',
                })

                return updatedOrder
            })
        },

        /**
         * Cancel an order - domain-specific action
         * @param {string} id - Order ID
         */
        async cancelOrder(id) {
            const { showWarning } = useNotifications()

            return withLoading(this, async () => {
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
                showWarning(`Order #${id} has been cancelled`, {
                    sound: 'warning',
                    icon: 'mdi-cancel',
                })

                return updatedOrder
            })
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


