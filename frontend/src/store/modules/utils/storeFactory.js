import { defineStore } from 'pinia'
import { handleAsyncAction } from './stateHelpers'

/**
 * Factory function to create a base store with common state, actions, and getters
 * This eliminates code duplication across stores while allowing for customization
 *
 * @param {Object} options - Configuration options for the store
 * @param {string} options.id - Unique ID for the store
 * @param {Object} options.api - API service for CRUD operations (optional)
 * @param {Function} options.customState - Custom state factory function to extend base state
 * @param {Object} options.customGetters - Custom getters to extend base getters
 * @param {Object} options.customActions - Custom actions to extend base actions
 * @returns {Object} A Pinia store with merged base and custom functionality
 */
export const createBaseStore = ({
    id,
    api = null,
    customState = () => ({}),
    customGetters = {},
    customActions = {},
}) => {
    // Create the store using Pinia's defineStore
    return defineStore(id, {
        // Merge base state with custom state
        state: () => ({
            // Common state properties
            loading: false,
            error: null,
            items: [],
            current: null,
            initialized: false,
            meta: {},
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                pages: 0,
            },
            filters: {},

            // Merge with custom state
            ...customState(),
        }),

        // Merge base getters with custom getters
        getters: {
            // Common getters
            isLoading: (state) => state.loading,
            hasError: (state) => !!state.error,
            isEmpty: (state) => state.items.length === 0,
            itemCount: (state) => state.items.length,
            isInitialized: (state) => state.initialized,

            // Paginated items getter
            paginatedItems: (state) => {
                if (!state.pagination || state.pagination.page <= 1) {
                    return state.items
                }

                const { page, limit } = state.pagination
                const startIndex = (page - 1) * limit
                return state.items.slice(startIndex, startIndex + limit)
            },

            // Merge with custom getters
            ...customGetters,
        },

        // Merge base actions with custom actions
        actions: {
            /**
             * Set the loading state
             * @param {boolean} status - New loading status
             */
            setLoading(status) {
                this.loading = status
            },

            /**
             * Set the error state
             * @param {string|null} error - Error message or null to clear
             */
            setError(error) {
                this.error = error
            },

            /**
             * Set the items array
             * @param {Array} items - New items array
             */
            setItems(items) {
                this.items = Array.isArray(items) ? items : []
            },

            /**
             * Clear any error state
             */
            clearError() {
                this.error = null
            },

            /**
             * Reset the store state to initial values
             * Preserves custom state properties
             */
            resetState() {
                // Reset common state properties
                this.loading = false
                this.error = null
                this.items = []
                this.current = null
                this.initialized = false
                this.pagination = {
                    page: 1,
                    limit: 10,
                    total: 0,
                    pages: 0,
                }
                this.filters = {}
                this.meta = {}
            },

            /**
             * Initialize the store
             * Can be overridden or extended in custom actions
             */
            async initializeStore() {
                if (this.initialized) return

                // If API is provided, fetch initial data
                if (api && typeof api.fetchAll === 'function') {
                    await this.fetchAll()
                }

                this.initialized = true
                return true
            },

            /**
             * Generic fetchAll method - gets all items
             * @param {Object} params - Query parameters for the request
             * @returns {Promise} - The fetched items
             */ async fetchAll(params = {}) {
                if (!api || typeof api.fetchAll !== 'function') {
                    return this.items
                }

                return handleAsyncAction(this, async () => {
                    const response = await api.fetchAll(params)

                    // Handle different API response formats
                    if (Array.isArray(response)) {
                        this.items = response
                        this.pagination = {
                            page: 1,
                            limit: response.length,
                            total: response.length,
                            pages: 1,
                        }
                    } else if (response && typeof response === 'object') {
                        // If API returns an object with items and pagination
                        this.items = response.items || response.data || response.results || []

                        // Update pagination if provided
                        if (response.pagination) {
                            this.pagination = response.pagination
                        } else if (response.meta && response.meta.pagination) {
                            this.pagination = response.meta.pagination
                        }

                        // Update metadata if provided
                        if (response.meta) {
                            this.meta = response.meta
                        }
                    }

                    return this.items
                })
            },

            /**
             * Generic fetchById method - gets a single item
             * @param {string|number} id - ID of the item to fetch
             * @returns {Promise} - The fetched item
             */ async fetchById(id) {
                if (!api || typeof api.fetchById !== 'function') {
                    return null
                }

                return handleAsyncAction(this, async () => {
                    const item = await api.fetchById(id)
                    this.current = item
                    return item
                })
            },

            /**
             * Generic create method - creates a new item
             * @param {Object} payload - Data for the new item
             * @returns {Promise} - The created item
             */ async create(payload) {
                if (!api || typeof api.create !== 'function') {
                    return null
                }

                return handleAsyncAction(this, async () => {
                    const item = await api.create(payload)
                    this.items.push(item)
                    this.current = item
                    return item
                })
            },

            /**
             * Generic update method - updates an existing item
             * @param {string|number} id - ID of the item to update
             * @param {Object} payload - Updated data
             * @returns {Promise} - The updated item
             */ async update(id, payload) {
                if (!api || typeof api.update !== 'function') {
                    return null
                }

                return handleAsyncAction(this, async () => {
                    const item = await api.update(id, payload)

                    // Update the item in the items array
                    const index = this.items.findIndex((i) => i.id === id || i._id === id)
                    if (index !== -1) {
                        this.items.splice(index, 1, item)
                    }

                    this.current = item
                    return item
                })
            },

            /**
             * Generic delete method - deletes an item
             * @param {string|number} id - ID of the item to delete
             * @returns {Promise} - Success indicator
             */ async delete(id) {
                if (!api || typeof api.delete !== 'function') {
                    return false
                }

                return handleAsyncAction(this, async () => {
                    await api.delete(id)

                    // Remove the item from the items array
                    this.items = this.items.filter((item) => item.id !== id && item._id !== id)

                    // Clear current if it's the deleted item
                    if (this.current && (this.current.id === id || this.current._id === id)) {
                        this.current = null
                    }

                    return true
                })
            },

            // Apply custom filters
            applyFilters(filters = {}) {
                this.filters = { ...this.filters, ...filters }
                return this.filters
            },

            // Clear filters
            clearFilters() {
                this.filters = {}
            },

            // Update pagination
            updatePagination(paginationData) {
                this.pagination = { ...this.pagination, ...paginationData }
            },

            // Merge with custom actions
            ...customActions,
        },
    })
}
