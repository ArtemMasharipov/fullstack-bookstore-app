import { toast } from '@/store'

/**
 * Toast synchronization utility
 *
 * This utility ensures that toast notifications are properly displayed
 * by creating a consistent timing mechanism for showing them after store operations.
 */

/**
 * Show a toast notification after a brief delay to ensure it appears
 * even when navigating between pages or after state updates.
 *
 * @param {Function} toastFn - The toast function to call (toast.success, toast.error, etc.)
 * @param {string|Array} message - The message to show or array of [message, options]
 * @param {Object} [options] - Options for the toast
 * @returns {void}
 */
export function syncToast(toastFn, message, options = {}) {
    // Ensure toast is displayed even during navigation or state updates
    setTimeout(() => {
        if (Array.isArray(message)) {
            // If message is an array, assume [message, options] format
            toastFn(...message)
        } else {
            toastFn(message, options)
        }
    }, 100)
}

/**
 * Simple wrapper for showing success toast in a synchronized way
 * @param {string} message - Success message
 * @param {Object} [options] - Toast options
 */
export function syncSuccess(message, options = {}) {
    syncToast(toast.success, message, options)
}

/**
 * Simple wrapper for showing error toast in a synchronized way
 * @param {string} message - Error message
 * @param {Object} [options] - Toast options
 */
export function syncError(message, options = {}) {
    syncToast(toast.error, message, options)
}

/**
 * Simple wrapper for showing info toast in a synchronized way
 * @param {string} message - Info message
 * @param {Object} [options] - Toast options
 */
export function syncInfo(message, options = {}) {
    syncToast(toast.info, message, options)
}

export default {
    syncToast,
    syncSuccess,
    syncError,
    syncInfo,
}
