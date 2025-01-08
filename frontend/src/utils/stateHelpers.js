export const handleAsyncAction = async (commit, action, options = {}) => {
    const { 
        onSuccess, 
        onError,
        loadingMutation = 'SET_LOADING',
        errorMutation = 'SET_ERROR',
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
