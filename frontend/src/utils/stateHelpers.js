import { UI } from '@/store/types'

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
