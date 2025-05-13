// Define mutation types directly since we're using Pinia
const UI = {
    SET_LOADING: 'setLoading',
    SET_ERROR: 'setError'
};

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
        maximumFractionDigits: 2
    }).format(amount || 0);
};

export const handleAsyncAction = async (commit, action, options = {}) => {
    const { 
        onSuccess, 
        onError,
        loadingMutation = UI.SET_LOADING,   // Используем UI.SET_LOADING вместо 'SET_LOADING'
        errorMutation = UI.SET_ERROR,       // Используем UI.SET_ERROR вместо 'SET_ERROR'
        skipLoading = false
    } = options

    !skipLoading && commit(loadingMutation, true)
    
    try {
        const result = await action()
        onSuccess?.(result)
        return result
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message
        commit(errorMutation, errorMessage)
        onError?.(error)
        throw error
    } finally {
        !skipLoading && commit(loadingMutation, false)
    }
}
