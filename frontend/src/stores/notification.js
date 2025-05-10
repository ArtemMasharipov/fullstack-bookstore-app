// src/stores/notification.js
import { useToast } from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'
import { createBaseStore } from './utils/storeFactory'

/**
 * Toast notification store
 * Provides a centralized way to show notifications across the app
 */
export const useNotificationStore = createBaseStore({
  id: 'notification',
  
  customState: () => ({
    toast: null,
    defaultOptions: {
      position: 'top-right',
      duration: 3000,
      dismissible: true,
      pauseOnHover: true,
      queue: true
    }
  }),
  
  customGetters: {
    getToast: (state) => {
      if (!state.toast) {
        state.toast = useToast()
      }
      return state.toast
    }
  },
  
  customActions: {
    /**
     * Show a success notification
     * @param {string} message - Message to display
     * @param {Object} options - Optional toast configuration options
     */
    success(message, options = {}) {
      this.getToast.success(message, { 
        ...this.defaultOptions, 
        ...options,
        type: 'success'
      })
    },
    
    /**
     * Show an error notification
     * @param {string} message - Message to display
     * @param {Object} options - Optional toast configuration options
     */
    error(message, options = {}) {
      this.getToast.error(message, { 
        ...this.defaultOptions, 
        ...options,
        type: 'error',
        duration: 5000 // Error messages stay longer
      })
    },
    
    /**
     * Show a warning notification
     * @param {string} message - Message to display
     * @param {Object} options - Optional toast configuration options
     */
    warning(message, options = {}) {
      this.getToast.warning(message, { 
        ...this.defaultOptions, 
        ...options,
        type: 'warning' 
      })
    },
    
    /**
     * Show an info notification
     * @param {string} message - Message to display
     * @param {Object} options - Optional toast configuration options
     */
    info(message, options = {}) {
      this.getToast.info(message, { 
        ...this.defaultOptions, 
        ...options,
        type: 'info' 
      })
    }
  }
})
