import { defineStore } from 'pinia'
import { handleAsyncAction } from './stateHelpers'
import {
    createLoadingActions,
    createLoadingState,
    createPaginationActions,
    createPaginationGetters,
    createPaginationState,
} from './storeHelpers'

/**
 * Base store factory - creates stores with common functionality
 */
export const createBaseStore = ({
    id,
    api = null,
    customState = () => ({}),
    customGetters = {},
    customActions = {},
    cacheTTL = 60000, // Default 60 seconds
}) => {
    // Create the store using Pinia's defineStore
    return defineStore(id, {
        // Merge base state with custom state
        state: () => ({
            // Common state properties
            items: [],
            current: null,
            initialized: false,
            meta: {},
            filters: {},

            // Cache properties
            lastFetch: null,
            cacheValid: false,
            cacheTTL: cacheTTL,

            ...createLoadingState(),
            ...createPaginationState(),

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

            // Cache getters
            isCacheValid: (state) => {
                if (!state.lastFetch) return false
                return Date.now() - state.lastFetch < state.cacheTTL
            },

            // Merge pagination getters
            ...createPaginationGetters(),

            // Merge with custom getters
            ...customGetters,
        },

        // Merge base actions with custom actions
        actions: {
            // Loading actions
            ...createLoadingActions(),

            // Pagination actions
            ...createPaginationActions(),

            /**
             * Set the items array
             * @param {Array} items - New items array
             */
            setItems(items) {
                this.items = Array.isArray(items) ? items : []
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
             * Generic fetchAll method - gets all items with caching
             * @param {Object} params - Query parameters for the request
             * @param {Object} options - Options for the request
             * @param {boolean} options.forceRefresh - Force refresh from server
             * @returns {Promise} - The fetched items
             */
            async fetchAll(params = {}, options = {}) {
                const { forceRefresh = false } = options

                if (!api || typeof api.fetchAll !== 'function') {
                    return this.items
                }

                // Check cache validity
                if (!forceRefresh && this.isCacheValid && this.items.length > 0) {
                    console.log(`[${id}] Using cached data`)
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

                    // Update cache timestamp
                    this.lastFetch = Date.now()
                    this.cacheValid = true

                    return this.items
                })
            },

            /**
             * Generic fetchById method - gets a single item
             * @param {string|number} id - ID of the item to fetch
             * @returns {Promise} - The fetched item
             */
            async fetchById(id) {
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
             */
            async create(payload) {
                if (!api || typeof api.create !== 'function') {
                    return null
                }

                return handleAsyncAction(this, async () => {
                    const item = await api.create(payload)
                    this.items.push(item)
                    this.current = item
                    // Invalidate cache after creating new item
                    this.invalidateCache()
                    return item
                })
            },

            /**
             * Generic update method - updates an existing item
             * @param {string|number} id - ID of the item to update
             * @param {Object} payload - Updated data
             * @returns {Promise} - The updated item
             */
            async update(id, payload) {
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
                    // Invalidate cache after updating item
                    this.invalidateCache()
                    return item
                })
            },

            /**
             * Generic delete method - deletes an item
             * @param {string|number} id - ID of the item to delete
             * @returns {Promise} - Success indicator
             */
            async delete(id) {
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

                    // Invalidate cache after deleting item
                    this.invalidateCache()
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

            /**
             * Invalidate cache - forces next fetch to go to server
             */
            invalidateCache() {
                this.lastFetch = null
                this.cacheValid = false
            },

            /**
             * Refresh data from server (force refresh)
             * @param {Object} params - Query parameters
             * @returns {Promise} - Fresh data from server
             */
            async refresh(params = {}) {
                return this.fetchAll(params, { forceRefresh: true })
            },

            // Merge with custom actions
            ...customActions,
        },
    })
}
