import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'

/**
 * API composable - handles async operations with loading and error states
 */
export function useApi(apiCall, options = {}) {
    const { autoExecute = false, onSuccess, onError, showErrorToast = true, context = 'api' } = options

    // Reactive state
    const loading = ref(false)
    const error = ref(null)
    const data = ref(null)

    // Computed properties
    const isLoading = computed(() => loading.value)
    const hasError = computed(() => !!error.value)
    const isSuccess = computed(() => !loading.value && !error.value && data.value !== null)

    /**
     * Execute the API call
     * @param {*} params - Parameters to pass to the API call
     * @returns {Promise} The result of the API call
     */
    const execute = async (params) => {
        loading.value = true
        error.value = null

        try {
            const result = await apiCall(params)
            data.value = result

            // Call success callback if provided
            if (onSuccess) {
                onSuccess(result)
            }

            logger.info(`API call successful`, { context, params }, context)
            return result
        } catch (err) {
            const errorMessage = err?.response?.data?.message || err.message || 'An error occurred'
            error.value = errorMessage

            // Call error callback if provided
            if (onError) {
                onError(err)
            }

            logger.error(`API call failed: ${errorMessage}`, err, context)

            // Show error toast if enabled
            if (showErrorToast) {
                // Import useNotifications dynamically to avoid circular dependencies
                import('@/composables/useNotifications')
                    .then(({ useNotifications }) => {
                        const { showError } = useNotifications()
                        showError(errorMessage, { icon: 'mdi-alert-circle' })
                    })
                    .catch(() => {
                        // Fallback to console if notifications are not available
                        // API Error
                    })
            }

            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Reset the state
     */
    const reset = () => {
        loading.value = false
        error.value = null
        data.value = null
    }

    /**
     * Clear only the error state
     */
    const clearError = () => {
        error.value = null
    }

    // Auto-execute if requested
    if (autoExecute) {
        execute()
    }

    return {
        // State
        loading: isLoading,
        error: computed(() => error.value),
        data: computed(() => data.value),

        // Computed
        isLoading,
        hasError,
        isSuccess,

        // Methods
        execute,
        reset,
        clearError,
    }
}

/**
 * CRUD API composable - handles CRUD operations
 */
export function useCrudApi(api, options = {}) {
    const { context = 'crud', showErrorToast = true } = options

    // Individual API composables for each operation
    const fetchAll = useApi(api.fetchAll || api.getAll, {
        context: `${context}-fetch`,
        showErrorToast,
    })

    const fetchById = useApi(api.fetchById || api.getById, {
        context: `${context}-fetch-by-id`,
        showErrorToast,
    })

    const create = useApi(api.create, {
        context: `${context}-create`,
        showErrorToast,
    })

    const update = useApi(api.update, {
        context: `${context}-update`,
        showErrorToast,
    })

    const remove = useApi(api.delete || api.remove, {
        context: `${context}-delete`,
        showErrorToast,
    })

    return {
        // Individual operations
        fetchAll,
        fetchById,
        create,
        update,
        remove,

        // Combined state
        loading: computed(
            () =>
                fetchAll.isLoading.value ||
                fetchById.isLoading.value ||
                create.isLoading.value ||
                update.isLoading.value ||
                remove.isLoading.value
        ),

        error: computed(
            () =>
                fetchAll.error.value ||
                fetchById.error.value ||
                create.error.value ||
                update.error.value ||
                remove.error.value
        ),

        // Combined methods
        resetAll: () => {
            fetchAll.reset()
            fetchById.reset()
            create.reset()
            update.reset()
            remove.reset()
        },

        clearAllErrors: () => {
            fetchAll.clearError()
            fetchById.clearError()
            create.clearError()
            update.clearError()
            remove.clearError()
        },
    }
}
