/**
 * Helper Utilities Index
 * Центральный экспорт всех вспомогательных утилит
 */

export * from './currency.js'
// export * from './errorHandling.js' // файл удален
// export * from './formatters.js' // файл удален

// Date utilities
export const formatDate = (date, locale = 'ru-RU') => {
    if (!date) return ''
    return new Date(date).toLocaleDateString(locale)
}

export const formatDateTime = (date, locale = 'ru-RU') => {
    if (!date) return ''
    return new Date(date).toLocaleString(locale)
}

// Array utilities
export const uniqueBy = (array, key) => {
    return array.filter((item, index, self) => index === self.findIndex((t) => t[key] === item[key]))
}

export const sortBy = (array, key, direction = 'asc') => {
    return [...array].sort((a, b) => {
        if (direction === 'desc') {
            return b[key] > a[key] ? 1 : -1
        }
        return a[key] > b[key] ? 1 : -1
    })
}

// String utilities
export const truncate = (str, length = 100) => {
    if (!str || str.length <= length) return str
    return str.substring(0, length) + '...'
}

export const capitalize = (str) => {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// Validation utilities
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export const isValidUrl = (url) => {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}
