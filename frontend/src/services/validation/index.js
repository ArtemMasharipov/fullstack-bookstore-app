/**
 * Validation Services
 * Центральный экспорт всех validation схем
 */

export * from './schemas/book.js'
export * from './schemas/author.js'
export * from './schemas/user.js'
export * from './schemas/order.js'

// Общие валидационные утилиты
export const isEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isRequired = (value) => {
  return value !== null && value !== undefined && value !== ''
}

export const minLength = (value, min) => {
  return value && value.length >= min
}

export const maxLength = (value, max) => {
  return !value || value.length <= max
}
