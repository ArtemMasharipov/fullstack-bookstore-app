export const handleAsyncAction = async (commit, action, options = {}) => {
    const { setLoading = 'SET_LOADING', setError = 'SET_ERROR', onSuccess, onError, onFinally } = options

    commit(setLoading, true)
    try {
        const result = await action()
        if (onSuccess) await onSuccess(result)
        return result
    } catch (error) {
        commit(setError, error.message)
        if (onError) await onError(error)
        throw error
    } finally {
        commit(setLoading, false)
        if (onFinally) await onFinally()
    }
}
