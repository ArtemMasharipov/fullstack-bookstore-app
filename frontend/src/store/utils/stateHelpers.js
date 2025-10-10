// Define mutation types directly since we're using Pinia
const UI = {
    SET_LOADING: 'setLoading',
    SET_ERROR: 'setError',
}

/**
 * Format a number value as a currency
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - ISO 4217 currency code
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount || 0)
}

/**
 * Handle async actions with loading and error states
 * @param {Object} store - Pinia store instance
 * @param {Function} action - Async action to execute
 * @param {Object} options - Configuration options
 * @returns {Promise} Result of the action
 */
export const handleAsyncAction = async (store, action, options = {}) => {
    const {
        onSuccess,
        onError,
        loadingMutation = UI.SET_LOADING,
        errorMutation = UI.SET_ERROR,
        skipLoading = false,
    } = options

    // In Pinia, we directly call the mutation methods on the store
    !skipLoading && store[loadingMutation](true)

    try {
        const result = await action()
        onSuccess?.(result)
        return result
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message
        store[errorMutation](errorMessage)
        onError?.(error)
        throw error
    } finally {
        !skipLoading && store[loadingMutation](false)
    }
}
