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
            console.error('Error reading from localStorage:', error)
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
            console.error('Error writing to localStorage:', error)
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
            console.error('Error removing from localStorage:', error)
        }
    },

    /**
     * Очистить localStorage
     */
    clear() {
        try {
            window.localStorage.clear()
        } catch (error) {
            console.error('Error clearing localStorage:', error)
        }
    },
}
