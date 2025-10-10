import { logger } from '@/utils/logger'
import { computed, ref } from 'vue'

/**
 * Universal composable for handling API calls with loading and error states
 * Provides a consistent interface for async operations across the application
 * 
 * @param {Function} apiCall - The API function to call
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoExecute - Whether to execute immediately (default: false)
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @param {boolean} options.showErrorToast - Whether to show error notifications (default: true)
 * @param {string} options.context - Context for logging (default: 'api')
 * @returns {Object} API composable interface
 */
export function useApi(apiCall, options = {}) {
    const {
        autoExecute = false,
        onSuccess,
        onError,
        showErrorToast = true,
        context = 'api'
    } = options

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
                import('@/composables/useNotifications').then(({ useNotifications }) => {
                    const { showError } = useNotifications()
                    showError(errorMessage, { icon: 'mdi-alert-circle' })
                }).catch(() => {
                    // Fallback to console if notifications are not available
                    console.error('Error:', errorMessage)
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
        clearError
    }
}

/**
 * Specialized composable for CRUD operations
 * Provides common patterns for create, read, update, delete operations
 * 
 * @param {Object} api - API service object with CRUD methods
 * @param {Object} options - Configuration options
 * @returns {Object} CRUD composable interface
 */
export function useCrudApi(api, options = {}) {
    const {
        context = 'crud',
        showErrorToast = true
    } = options

    // Individual API composables for each operation
    const fetchAll = useApi(api.fetchAll || api.getAll, { 
        context: `${context}-fetch`, 
        showErrorToast 
    })
    
    const fetchById = useApi(api.fetchById || api.getById, { 
        context: `${context}-fetch-by-id`, 
        showErrorToast 
    })
    
    const create = useApi(api.create, { 
        context: `${context}-create`, 
        showErrorToast 
    })
    
    const update = useApi(api.update, { 
        context: `${context}-update`, 
        showErrorToast 
    })
    
    const remove = useApi(api.delete || api.remove, { 
        context: `${context}-delete`, 
        showErrorToast 
    })

    return {
        // Individual operations
        fetchAll,
        fetchById,
        create,
        update,
        remove,
        
        // Combined state
        loading: computed(() => 
            fetchAll.isLoading.value || 
            fetchById.isLoading.value || 
            create.isLoading.value || 
            update.isLoading.value || 
            remove.isLoading.value
        ),
        
        error: computed(() => 
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
        }
    }
}
