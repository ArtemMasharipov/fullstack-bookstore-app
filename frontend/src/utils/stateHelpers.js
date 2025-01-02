export const handleAsyncAction = async (commit, action, mutations = {}) => {
    const { setLoading = 'SET_LOADING', setError = 'SET_ERROR' } = mutations;
    commit(setLoading, true);
    
    try {
        const result = await action();
        return result;
    } catch (error) {
        commit(setError, error.message);
        throw error;
    } finally {
        commit(setLoading, false);
    }
}
