/**
 * Local Storage Service
 * Утилиты для работы с localStorage
 */

export const localStorage = {
    /**
     * Получить значение из localStorage
     * @param {string} key - ключ
     * @param {any} defaultValue - значение по умолчанию
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
     * Сохранить значение в localStorage
     * @param {string} key - ключ
     * @param {any} value - значение
     */
    set(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            // Error writing to localStorage
        }
    },

    /**
     * Удалить значение из localStorage
     * @param {string} key - ключ
     */
    remove(key) {
        try {
            window.localStorage.removeItem(key)
        } catch (error) {
            // Error removing from localStorage
        }
    },

    /**
     * Очистить localStorage
     */
    clear() {
        try {
            window.localStorage.clear()
        } catch (error) {
            // Error clearing localStorage
        }
    },
}
