import { orderApi } from '@/services/api/orderApi'
import { useCartStore } from '@/store/modules/cart/cart'
import { handleAsyncAction } from '@/store/modules/utils/stateHelpers'
import { createBaseStore } from '@/store/modules/utils/storeFactory'
import { toast } from '@/store/modules/utils/toast'

/**
 * Orders store using the base store factory
 * - Uses shared logic from the factory to eliminate code duplication
 * - Preserves order-specific business logic and actions
 */
export const useOrdersStore = createBaseStore({
    id: 'orders',
    api: orderApi,

    // Custom state specific to orders store
    customState: () => ({
        // Map to maintain API compatibility with existing components
        orders: [], // This will be synced with 'items' in the base store
        _currentOrder: null, // This will be synced with 'current' in the base store, renamed to avoid conflict
    }),

    // Custom getters specific to orders store
    customGetters: {
        // Map base store getters to order-specific names for API compatibility
        ordersList: (state) => {
            // Make absolutely sure we return an array
            if (Array.isArray(state.orders)) return state.orders
            if (Array.isArray(state.items)) return state.items
            return [] // Return empty array as fallback
        },
        getOrder: (state) => state._currentOrder || state.current, // Renamed from currentOrder to avoid conflict
        // loading and error are provided by base store
    },

    // Custom actions specific to orders store
    customActions: {
        /**
         * Create a new order and clear the cart after success
         * @param {Object} orderData - Data for the new order
         */
        async createOrder(orderData) {
            return handleAsyncAction(this, async () => {
                // The API endpoint is different from the standard CRUD pattern
                const order = await orderApi.createOrder(orderData)

                // Ensure arrays exist before trying to unshift
                if (!Array.isArray(this.orders)) {
                    this.orders = []
                }
                if (!Array.isArray(this.items)) {
                    this.items = []
                }

                // Add to the beginning of the list
                this.orders.unshift(order)
                this.items.unshift(order) // Keep base store items in sync

                // Clear the cart after order is created
                const cartStore = useCartStore()
                await cartStore.clearCart()
                // Notify user
                toast.success(`Order #${order._id || order.id || 'New'} placed successfully!`, {
                    duration: 6000,
                    position: 'top-center',
                })

                return order
            })
        },

        /**
         * Fetch all orders
         */
        async fetchOrders() {
            return handleAsyncAction(this, async () => {
                try {
                    // API call is different from standard CRUD
                    const orders = await orderApi.getOrders()

                    // Ensure we always set arrays, even if API returns null/undefined
                    this.orders = Array.isArray(orders) ? orders : []
                    this.items = Array.isArray(orders) ? orders : [] // Keep base store items in sync

                    return orders
                } catch (error) {
                    // Initialize empty arrays on error to prevent unshift issues
                    this.orders = []
                    this.items = []
                    throw error
                }
            })
        },

        /**
         * Fetch order by ID
         * @param {string} id - Order ID
         */
        async fetchOrderById(id) {
            return handleAsyncAction(this, async () => {
                // API call is different from standard CRUD
                const order = await orderApi.getOrderById(id)

                // Update both our custom property and base store property
                this._currentOrder = order
                this.current = order // Keep base store current in sync

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
            return handleAsyncAction(this, async () => {
                // This is a domain-specific action
                const updatedOrder = await orderApi.updateOrderStatus(id, status)

                // Update the order in our list
                const orderInItems = this.items.find((o) => o._id === id)
                if (orderInItems) {
                    orderInItems.status = updatedOrder.status
                }

                const orderInOrders = this.orders.find((o) => o._id === id)
                if (orderInOrders) {
                    orderInOrders.status = updatedOrder.status
                }
                // Notify user
                toast.success(`Order #${id} status updated to "${status}"`, {
                    duration: 4000,
                })

                return updatedOrder
            })
        },

        /**
         * Cancel an order - domain-specific action
         * @param {string} id - Order ID
         */
        async cancelOrder(id) {
            return handleAsyncAction(this, async () => {
                // This is a domain-specific action
                const updatedOrder = await orderApi.cancelOrder(id)

                // Update the order in our lists
                const orderInItems = this.items.find((o) => o._id === id)
                if (orderInItems) {
                    orderInItems.status = updatedOrder.status
                }

                const orderInOrders = this.orders.find((o) => o._id === id)
                if (orderInOrders) {
                    orderInOrders.status = updatedOrder.status
                }
                // Notify user
                toast.warning(`Order #${id} has been cancelled`, {
                    duration: 4000,
                })

                return updatedOrder
            })
        },

        /**
         * Custom initialize method to ensure arrays are properly set
         */
        async initializeStore() {
            // Initialize arrays if they're not already
            if (!Array.isArray(this.orders)) {
                this.orders = []
            }
            if (!Array.isArray(this.items)) {
                this.items = []
            }

            // Call the base implementation
            if (!this.initialized) {
                // If API is provided, fetch initial data
                try {
                    await this.fetchOrders()
                } catch (error) {
                    // Silently handle errors during initialization
                    console.warn('Failed to initialize orders store:', error)
                }

                this.initialized = true
            }

            return true
        },
    },
})
