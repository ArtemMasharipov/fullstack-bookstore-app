/**
 * Вспомогательная функция для обработки асинхронных действий в хранилищах Pinia
 * @param {Function} action - Асинхронная функция, которую нужно выполнить
 * @param {Object} options - Опции для обработки действия
 * @returns {Promise} Результат выполнения действия
 */
export const handleAsyncAction = async (store, action, options = {}) => {
    const {
        onSuccess,
        onError,
        skipLoading = false
    } = options;

    if (!skipLoading) {
        store.loading = true;
    }

    try {
        const result = await action();
        onSuccess?.(result);
        return result;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error.message;
        store.error = errorMessage;
        onError?.(error);
        throw error;
    } finally {
        if (!skipLoading) {
            store.loading = false;
        }
    }
}