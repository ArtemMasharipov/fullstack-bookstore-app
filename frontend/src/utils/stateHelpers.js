export const handleAsyncAction = async (commit, action, mutations = {}) => {
    const { setLoading = null, setError = null } = mutations
    if (setLoading) commit(setLoading, true)

    try {
        return await action()
    } catch (error) {
        if (setError) commit(setError, error)
        throw error
    } finally {
        if (setLoading) commit(setLoading, false)
    }
}
