/**
 * Store helper functions for common state patterns
 * Provides composable helpers instead of complex factory pattern
 */

/**
 * Creates loading state (loading, error)
 * @returns {Object} Loading state object
 */
export function createLoadingState() {
    return {
        loading: false,
        error: null,
    }
}

/**
 * Creates pagination state
 * @returns {Object} Pagination state object
 */
export function createPaginationState() {
    return {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    }
}

/**
 * Creates loading actions
 * @returns {Object} Loading actions object
 */
export function createLoadingActions() {
    return {
        setLoading(status) {
            this.loading = status
        },
        setError(error) {
            this.error = error
        },
        clearError() {
            this.error = null
        },
    }
}

/**
 * Creates pagination actions
 * @returns {Object} Pagination actions object
 */
export function createPaginationActions() {
    return {
        setPage(page) {
            this.page = page
        },
        setLimit(limit) {
            this.limit = limit
            this.page = 1 // Reset to first page
        },
        updatePagination(paginationData) {
            Object.assign(this, paginationData)
        },
    }
}

/**
 * Creates pagination getters
 * @returns {Object} Pagination getters object
 */
export function createPaginationGetters() {
    return {
        hasNextPage() {
            return this.page < this.pages
        },
        hasPrevPage() {
            return this.page > 1
        },
        paginatedItems() {
            if (!this.items || this.page <= 1) {
                return this.items || []
            }
            const startIndex = (this.page - 1) * this.limit
            return (this.items || []).slice(startIndex, startIndex + this.limit)
        },
    }
}
