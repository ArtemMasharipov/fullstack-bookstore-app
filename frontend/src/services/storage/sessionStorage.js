/**
 * Session Storage Service
 * Утилиты для работы с sessionStorage
 */

export const sessionStorage = {
    /**
     * Получить значение из sessionStorage
     * @param {string} key - ключ
     * @param {any} defaultValue - значение по умолчанию
     * @returns {any}
     */
    get(key, defaultValue = null) {
        try {
            const item = window.sessionStorage.getItem(key)
            return item ? JSON.parse(item) : defaultValue
        } catch (error) {
            console.error('Error reading from sessionStorage:', error)
            return defaultValue
        }
    },

    /**
     * Сохранить значение в sessionStorage
     * @param {string} key - ключ
     * @param {any} value - значение
     */
    set(key, value) {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
            console.error('Error writing to sessionStorage:', error)
        }
    },

    /**
     * Удалить значение из sessionStorage
     * @param {string} key - ключ
     */
    remove(key) {
        try {
            window.sessionStorage.removeItem(key)
        } catch (error) {
            console.error('Error removing from sessionStorage:', error)
        }
    },

    /**
     * Очистить sessionStorage
     */
    clear() {
        try {
            window.sessionStorage.clear()
        } catch (error) {
            console.error('Error clearing sessionStorage:', error)
        }
    },
}
