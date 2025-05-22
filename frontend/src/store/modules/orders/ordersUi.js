import { useOrdersStore } from '@/store/modules/orders/orders'
import { toast } from '@/store/modules/utils/toast'
import { defineStore } from 'pinia'
import { formatPrice } from '@/utils'

/**
 * Store for managing Orders UI state and interactions
 * Handles order filtering, sorting, pagination and UI helpers
 */
export const useOrdersUiStore = defineStore('ordersUi', {
    state: () => ({
        statusFilter: null,
        sortBy: 'newest',
        currentPage: 1,
        itemsPerPage: 5,
        statusOptions: [
            { title: 'All Orders', value: null },
            { title: 'Pending', value: 'pending' },
            { title: 'Processing', value: 'processing' },
            { title: 'Shipped', value: 'shipped' },
            { title: 'Delivered', value: 'delivered' },
            { title: 'Cancelled', value: 'cancelled' },
        ],
        sortOptions: [
            { title: 'Newest First', value: 'newest' },
            { title: 'Oldest First', value: 'oldest' },
            { title: 'Highest Total', value: 'total-desc' },
            { title: 'Lowest Total', value: 'total-asc' },
        ],
    }),
    getters: {
        /**
         * Get status filter
         */
        getStatusFilter: (state) => state.statusFilter,

        /**
         * Get sort by option
         */
        getSortBy: (state) => state.sortBy,

        /**
         * Get current page
         */
        getCurrentPage: (state) => state.currentPage,

        /**
         * Get items per page
         */
        getItemsPerPage: (state) => state.itemsPerPage,

        /**
         * Get status options
         */
        getStatusOptions: (state) => state.statusOptions,

        /**
         * Get sort options
         */
        getSortOptions: (state) => state.sortOptions,

        /**
         * Filter and sort orders based on selected criteria
         */
        filteredOrders(state) {
            const ordersStore = useOrdersStore()
            // Ensure ordersList is an array even if it's undefined, null or not iterable
            let result = []

            // Safely copy and handle array values
            if (ordersStore && ordersStore.ordersList) {
                if (Array.isArray(ordersStore.ordersList)) {
                    result = [...ordersStore.ordersList]
                } else {
                    console.warn('ordersList is not an array:', ordersStore.ordersList)
                }
            }

            // Apply status filter
            if (state.statusFilter && result.length > 0) {
                result = result.filter((order) => order.status === state.statusFilter)
            }

            // Apply sort
            switch (state.sortBy) {
                case 'newest':
                    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    break
                case 'oldest':
                    result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                    break
                case 'total-desc':
                    result.sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
                    break
                case 'total-asc':
                    result.sort((a, b) => parseFloat(a.total) - parseFloat(b.total))
                    break
            }

            return result
        },

        /**
         * Get orders for current page
         */
        displayedOrders(state) {
            // Ensure we always have an array, even if filteredOrders is undefined
            const filtered = Array.isArray(this.filteredOrders) ? this.filteredOrders : []
            const start = Math.min((state.currentPage - 1) * state.itemsPerPage, filtered.length)
            const end = Math.min(start + state.itemsPerPage, filtered.length)
            return filtered.slice(start, end)
        },

        /**
         * Calculate total page count
         */
        pageCount(state) {
            // Protection against NaN when dividing by zero or if filteredOrders is undefined
            const filtered = Array.isArray(this.filteredOrders) ? this.filteredOrders : []
            const length = filtered.length
            return Math.max(1, Math.ceil(length / state.itemsPerPage))
        },

        // Add getters for all state properties
        getStatusFilter: (state) => state.statusFilter,
        getSortBy: (state) => state.sortBy,
        getCurrentPage: (state) => state.currentPage,
        getItemsPerPage: (state) => state.itemsPerPage,
        getStatusOptions: (state) => state.statusOptions,
        getSortOptions: (state) => state.sortOptions,
    },

    actions: {
        /**
         * Fetch orders from API
         */
        async fetchOrders() {
            const ordersStore = useOrdersStore()
            try {
                return await ordersStore.fetchOrders()
            } catch (error) {
                // Don't show auth errors since they're handled by the API interceptor
                if (error.status !== 401) {
                    // Special handling for 404 errors since orders endpoint might not be ready
                    if (error.status === 404) {
                        console.warn('Orders API endpoint not found. Using empty array as fallback.')
                        // Set empty orders array to avoid UI errors
                        ordersStore.orders = []
                        ordersStore.items = []

                        // Don't show error toast for expected 404 errors
                        if (!error.isExpected) {
                            toast.info('Orders service is currently unavailable.', {
                                duration: 3000,
                                position: 'top-center',
                            })
                        }
                    } else {
                        toast.error(error.message || 'Failed to load orders')
                    }
                }
            }
        },

        /**
         * Clear error state
         */
        clearError() {
            const ordersStore = useOrdersStore()
            ordersStore.clearError()
        },

        /**
         * Apply status filter
         */
        applyFilter(status) {
            this.statusFilter = status
            this.currentPage = 1 // Reset to first page when filtering
        },

        /**
         * Apply sort option
         */
        applySort(sortOption) {
            this.sortBy = sortOption
            this.currentPage = 1 // Reset to first page when sorting
        },

        /**
         * Helper method to safely get status color with fallbacks
         * @param {string} status - Order status
         * @returns {string} - Color name
         */
        getStatusColor(status) {
            if (!status) return 'grey'

            const statusColors = {
                pending: 'orange',
                processing: 'blue',
                shipped: 'cyan',
                delivered: 'success',
                cancelled: 'error',
            }

            return statusColors[status] || 'grey'
        },

        /**
         * Helper method to safely get status icon with fallbacks
         * @param {string} status - Order status
         * @returns {string} - Icon name
         */
        getStatusIcon(status) {
            if (!status) return 'mdi-help-circle'

            const statusIcons = {
                pending: 'mdi-clock-outline',
                processing: 'mdi-cog-outline',
                shipped: 'mdi-truck-delivery-outline',
                delivered: 'mdi-check-circle-outline',
                cancelled: 'mdi-close-circle-outline',
            }

            return statusIcons[status] || 'mdi-help-circle'
        },

        /**
         * Format date helper with fallback
         * @param {string|Date} date - Date to format
         * @returns {string} - Formatted date
         */
        formatDate(date) {
            if (!date) return 'Unknown date'
            try {
                return new Date(date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                })
            } catch (err) {
                console.warn('Date formatting error:', err)
                return String(date)
            }
        },

        /**
         * Format price helper with fallback
         * @param {number|string} price - Price to format
         * @returns {string} - Formatted price
         */
        formatPrice(price) {
            return formatPrice(price)
        },

        /**
         * Apply sorting
         */
        applySort(sort) {
            this.sortBy = sort
            this.currentPage = 1 // Reset to first page when sorting
        },

        /**
         * Get appropriate color for order status
         */
        getStatusColor(status) {
            const statusColors = {
                pending: 'warning',
                processing: 'info',
                shipped: 'success',
                delivered: 'primary',
                cancelled: 'error',
            }
            return statusColors[status] || 'grey'
        },

        /**
         * Get appropriate icon for order status
         */
        getStatusIcon(status) {
            const statusIcons = {
                pending: 'mdi-clock-outline',
                processing: 'mdi-progress-check',
                shipped: 'mdi-truck-delivery-outline',
                delivered: 'mdi-check-circle-outline',
                cancelled: 'mdi-cancel',
            }
            return statusIcons[status] || 'mdi-help-circle-outline'
        },

        /**
         * Format date in user-friendly way
         */
        formatDate(dateString) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }
            return new Date(dateString).toLocaleDateString(undefined, options)
        },

        /**
         * Format price using the centralized formatting utility
         */
        formatPrice(price) {
            return formatPrice(price)
        },
    },
})
