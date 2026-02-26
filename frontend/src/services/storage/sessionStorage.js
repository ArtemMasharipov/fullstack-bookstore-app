/**
 * Session Storage Service
 * Utilities for working with sessionStorage
 */

export const sessionStorage = {
    /**
     * Get value from sessionStorage
     * @param {string} key - key
     * @param {any} defaultValue - default value
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = window.sessionStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            // Error reading from sessionStorage
            return defaultValue
        }
    },

    /**
     * Save value to sessionStorage
     * @param {string} key - key
     * @param {any} value - value
     */
    set(key, value) {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            // Error writing to sessionStorage
        }
    },

    /**
     * Remove value from sessionStorage
     * @param {string} key - key
     */
    remove(key) {
        try {
            window.sessionStorage.removeItem(key)
        } catch (error) {
            // Error removing from sessionStorage
        }
    },

    /**
     * Clear sessionStorage
     */
    clear() {
        try {
            window.sessionStorage.clear()
        } catch (error) {
            // Error clearing sessionStorage
        }
    },
}
