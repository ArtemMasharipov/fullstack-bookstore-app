/**
 * Store Helper Utilities
 * Reduces boilerplate in Pinia store actions
 */

/**
 * Wraps async action with loading/error state management
 * Eliminates repetitive try-catch-finally blocks
 *
 * @param {Object} store - Pinia store instance (this)
 * @param {Function} action - Async function to execute
 * @param {Object} options - Optional configuration
 * @param {boolean} options.resetError - Whether to reset error before action (default: true)
 * @param {boolean} options.throwError - Whether to re-throw caught errors (default: true)
 * @returns {Promise} Result of the action
 *
 * @example
 * async fetchBooks() {
 *     return withLoading(this, async () => {
 *         const response = await booksApi.fetchAll()
 *         this.books = response.data
 *         return response
 *     })
 * }
 */
export async function withLoading(store, action, options = {}) {
    const { resetError = true, throwError = true } = options

    store.loading = true
    if (resetError) store.error = null

    try {
        const result = await action()
        return result
    } catch (error) {
        store.error = error.message || 'An error occurred'
        if (throwError) throw error
    } finally {
        store.loading = false
    }
}

/**
 * Simplified version for actions that don't need error state
 *
 * @example
 * async fetchData() {
 *     return withLoadingOnly(this, () => api.fetch())
 * }
 */
export async function withLoadingOnly(store, action) {
    store.loading = true
    try {
        return await action()
    } finally {
        store.loading = false
    }
}
