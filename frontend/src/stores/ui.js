import { defineStore } from 'pinia'

/**
 * UI Store for managing common UI state and functionality
 * Centralizes management of dialogs, alerts, errors, and responsive state
 */
export const useUiStore = defineStore('ui', {
  state: () => ({
    dialog: {
      visible: false,
      type: null,
      data: null,
    },
    snackbar: {
      visible: false,
      message: '',
      color: 'success',
      timeout: 3000
    },
    error: {
      hasError: false,
      message: null
    },
    windowWidth: window.innerWidth,
    searchQueries: {}
  }),

  getters: {
    isMobile: (state) => state.windowWidth < 600,
    dialogVisible: (state) => state.dialog.visible,
    dialogType: (state) => state.dialog.type,
    dialogData: (state) => state.dialog.data,
    snackbarVisible: (state) => state.snackbar.visible,
    snackbarMessage: (state) => state.snackbar.message,
    snackbarColor: (state) => state.snackbar.color,
    snackbarTimeout: (state) => state.snackbar.timeout,
    errorVisible: (state) => state.error.hasError,
    errorMessage: (state) => state.error.message,
    getSearchQuery: (state) => (moduleKey) => state.searchQueries[moduleKey] || ''
  },

  actions: {
    openDialog(type, data = null) {
      this.dialog = {
        visible: true,
        type,
        data
      }
    },

    closeDialog() {
      this.dialog = {
        visible: false,
        type: null,
        data: null
      }
    },

    showSnackbar({ message, color = 'success', timeout = 3000 }) {
      this.snackbar = {
        visible: true,
        message,
        color,
        timeout
      }
    },

    closeSnackbar() {
      this.snackbar.visible = false
    },

    showError(message) {
      this.error = {
        hasError: true,
        message
      }
    },

    clearError() {
      this.error = {
        hasError: false,
        message: null
      }
    },

    handleWindowResize() {
      this.windowWidth = window.innerWidth
    },

    setSearchQuery(moduleKey, query) {
      this.searchQueries = {
        ...this.searchQueries,
        [moduleKey]: query
      }
    },

    clearSearchQuery(moduleKey) {
      const { [moduleKey]: _, ...rest } = this.searchQueries
      this.searchQueries = rest
    }
  }
})