/**
 * Store helper functions
 */

/**
 * Create loading state
 */
export function createLoadingState() {
    return {
        loading: false,
        error: null,
    }
}

/**
 * Create pagination state
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
 * Create loading actions
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
 * Create pagination actions
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
 * Create pagination getters
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
