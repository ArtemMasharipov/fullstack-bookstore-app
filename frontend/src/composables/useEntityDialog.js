import { computed, reactive, ref } from 'vue'

/**
 * Universal composable for managing entity dialogs
 * Provides reusable dialog state management for create/edit/delete operations
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.entityName - Name of the entity (for logging/debugging)
 * @returns {Object} Dialog state and methods
 */
export function useEntityDialog(options = {}) {
  const { entityName = 'entity' } = options

  // Dialog states
  const dialogs = reactive({
    create: false,
    edit: false,
    delete: false,
    details: false
  })

  // Selected item for operations
  const selectedItem = ref(null)

  // Form state
  const formLoading = ref(false)
  const formErrors = ref({})

  /**
   * Open a specific dialog type
   * @param {string} type - Dialog type (create, edit, delete, details)
   * @param {Object} item - Item to operate on (optional)
   */
  function openDialog(type, item = null) {
    // Close all dialogs first
    closeDialogs()
    
    // Open the requested dialog
    if (dialogs.hasOwnProperty(type)) {
      dialogs[type] = true
      selectedItem.value = item
    } else {
      console.warn(`[useEntityDialog] Unknown dialog type: ${type}`)
    }
  }

  /**
   * Close all dialogs and reset state
   */
  function closeDialogs() {
    Object.keys(dialogs).forEach(key => {
      dialogs[key] = false
    })
    selectedItem.value = null
    clearFormErrors()
  }

  /**
   * Set form loading state
   * @param {boolean} loading - Loading state
   */
  function setFormLoading(loading) {
    formLoading.value = loading
  }

  /**
   * Set form errors
   * @param {Object} errors - Error object
   */
  function setFormErrors(errors) {
    formErrors.value = errors || {}
  }

  /**
   * Clear form errors
   */
  function clearFormErrors() {
    formErrors.value = {}
  }

  /**
   * Check if any dialog is open
   */
  const isAnyDialogOpen = computed(() => {
    return Object.values(dialogs).some(open => open)
  })

  /**
   * Check if form has errors
   */
  const hasFormErrors = computed(() => {
    return Object.keys(formErrors.value).length > 0
  })

  return {
    // State
    dialogs,
    selectedItem,
    formLoading,
    formErrors,
    
    // Computed
    isAnyDialogOpen,
    hasFormErrors,
    
    // Methods
    openDialog,
    closeDialogs,
    setFormLoading,
    setFormErrors,
    clearFormErrors
  }
}
