/**
 * Local Storage Service
 * Utilities for working with localStorage
 */

export const localStorage = {
    /**
     * Get value from localStorage
     * @param {string} key - key
     * @param {any} defaultValue - default value
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = window.localStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            // Error reading from localStorage
            return defaultValue
        }
    },

    /**
     * Save value to localStorage
     * @param {string} key - key
     * @param {any} value - value
     */
    set(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            // Error writing to localStorage
        }
    },

    /**
     * Remove value from localStorage
     * @param {string} key - key
     */
    remove(key) {
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            // Error removing from localStorage
        }
    },

    /**
     * Clear localStorage
     */
    clear() {
        try {
            window.localStorage.clear()
        } catch (error) {
            // Error clearing localStorage
        }
    },
}
