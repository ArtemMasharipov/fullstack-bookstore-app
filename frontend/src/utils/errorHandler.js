/**
 * Centralized Error Handler for Frontend
 * Единая точка обработки всех ошибок в frontend приложении
 * 
 * Принципы:
 * - Single Responsibility: только обработка ошибок
 * - Consistency: одинаковый формат ошибок
 * - User Experience: понятные сообщения для пользователя
 * - Logging: централизованное логирование
 */

import { logger } from './logger'

/**
 * Типы ошибок
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
}

/**
 * Коды ошибок HTTP
 */
export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
}

/**
 * Класс для ошибок приложения
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = 500, details = null) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * Централизованный обработчик ошибок
 */
export class ErrorHandler {
  /**
   * Обработка ошибки
   * @param {Error|AppError} error - Ошибка
   * @param {Object} context - Контекст (компонент, действие)
   * @returns {Object} - Нормализованная ошибка
   */
  static handle(error, context = {}) {
    // Логирование ошибки
    this.logError(error, context)

    // Нормализация ошибки
    const normalizedError = this.normalizeError(error)

    // Возврат нормализованной ошибки
    return normalizedError
  }

  /**
   * Нормализация ошибки
   * @param {Error} error - Исходная ошибка
   * @returns {Object} - Нормализованная ошибка
   */
  static normalizeError(error) {
    // Если это уже наша ошибка
    if (error instanceof AppError) {
      return {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        timestamp: error.timestamp,
        userMessage: this.getUserMessage(error.type, error.message)
      }
    }

    // Обработка сетевых ошибок
    if (error.message === 'Network Error' || !error.response) {
      return {
        type: ERROR_TYPES.NETWORK,
        message: 'Network connection error',
        statusCode: 0,
        details: error.message,
        timestamp: new Date().toISOString(),
        userMessage: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.'
      }
    }

    // Обработка HTTP ошибок
    if (error.response) {
      const { status, data } = error.response
      
      return {
        type: this.getErrorType(status),
        message: data?.message || data?.error || 'Server error',
        statusCode: status,
        details: data,
        timestamp: new Date().toISOString(),
        userMessage: this.getUserMessage(this.getErrorType(status), data?.message)
      }
    }

    // Неизвестная ошибка
    return {
      type: ERROR_TYPES.UNKNOWN,
      message: error.message || 'Unknown error occurred',
      statusCode: 500,
      details: error.stack,
      timestamp: new Date().toISOString(),
      userMessage: 'Произошла неизвестная ошибка. Попробуйте обновить страницу.'
    }
  }

  /**
   * Определение типа ошибки по статусу
   * @param {number} status - HTTP статус
   * @returns {string} - Тип ошибки
   */
  static getErrorType(status) {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return ERROR_TYPES.VALIDATION
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_TYPES.AUTHENTICATION
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_TYPES.AUTHORIZATION
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_TYPES.NOT_FOUND
      case HTTP_STATUS.CONFLICT:
        return ERROR_TYPES.VALIDATION
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        return ERROR_TYPES.SERVER
      default:
        return ERROR_TYPES.UNKNOWN
    }
  }

  /**
   * Получение пользовательского сообщения
   * @param {string} type - Тип ошибки
   * @param {string} message - Сообщение ошибки
   * @returns {string} - Пользовательское сообщение
   */
  static getUserMessage(type, message) {
    const messages = {
      [ERROR_TYPES.NETWORK]: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
      [ERROR_TYPES.VALIDATION]: message || 'Проверьте правильность введенных данных.',
      [ERROR_TYPES.AUTHENTICATION]: 'Необходимо войти в систему.',
      [ERROR_TYPES.AUTHORIZATION]: 'У вас нет прав для выполнения этого действия.',
      [ERROR_TYPES.NOT_FOUND]: 'Запрашиваемый ресурс не найден.',
      [ERROR_TYPES.SERVER]: 'Временные проблемы с сервером. Попробуйте позже.',
      [ERROR_TYPES.UNKNOWN]: 'Произошла неизвестная ошибка. Попробуйте обновить страницу.'
    }

    return messages[type] || messages[ERROR_TYPES.UNKNOWN]
  }

  /**
   * Логирование ошибки
   * @param {Error} error - Ошибка
   * @param {Object} context - Контекст
   */
  static logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      url: window.location?.href,
      userAgent: navigator.userAgent
    }

    if (error instanceof AppError) {
      logger.warn('Application error occurred', errorInfo)
    } else {
      logger.error('Unexpected error occurred', errorInfo)
    }
  }

  /**
   * Создание ошибки валидации
   * @param {string} message - Сообщение
   * @param {Object} details - Детали
   * @returns {AppError}
   */
  static createValidationError(message, details = null) {
    return new AppError(message, ERROR_TYPES.VALIDATION, HTTP_STATUS.BAD_REQUEST, details)
  }

  /**
   * Создание ошибки аутентификации
   * @param {string} message - Сообщение
   * @returns {AppError}
   */
  static createAuthError(message = 'Authentication required') {
    return new AppError(message, ERROR_TYPES.AUTHENTICATION, HTTP_STATUS.UNAUTHORIZED)
  }

  /**
   * Создание ошибки авторизации
   * @param {string} message - Сообщение
   * @returns {AppError}
   */
  static createAuthorizationError(message = 'Access forbidden') {
    return new AppError(message, ERROR_TYPES.AUTHORIZATION, HTTP_STATUS.FORBIDDEN)
  }

  /**
   * Создание ошибки "не найдено"
   * @param {string} message - Сообщение
   * @returns {AppError}
   */
  static createNotFoundError(message = 'Resource not found') {
    return new AppError(message, ERROR_TYPES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
  }

  /**
   * Создание сетевой ошибки
   * @param {string} message - Сообщение
   * @returns {AppError}
   */
  static createNetworkError(message = 'Network error') {
    return new AppError(message, ERROR_TYPES.NETWORK, 0)
  }
}

/**
 * Хук для обработки ошибок в Vue компонентах
 */
export function useErrorHandler() {
  const handleError = (error, context = {}) => {
    return ErrorHandler.handle(error, context)
  }

  const createError = (type, message, details = null) => {
    switch (type) {
      case ERROR_TYPES.VALIDATION:
        return ErrorHandler.createValidationError(message, details)
      case ERROR_TYPES.AUTHENTICATION:
        return ErrorHandler.createAuthError(message)
      case ERROR_TYPES.AUTHORIZATION:
        return ErrorHandler.createAuthorizationError(message)
      case ERROR_TYPES.NOT_FOUND:
        return ErrorHandler.createNotFoundError(message)
      case ERROR_TYPES.NETWORK:
        return ErrorHandler.createNetworkError(message)
      default:
        return new AppError(message, type)
    }
  }

  return {
    handleError,
    createError,
    ERROR_TYPES,
    HTTP_STATUS
  }
}

/**
 * Глобальный обработчик необработанных ошибок
 */
export function setupGlobalErrorHandling() {
  // Обработка необработанных ошибок
  window.addEventListener('error', (event) => {
    ErrorHandler.handle(event.error, { type: 'unhandled_error' })
  })

  // Обработка необработанных промисов
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handle(event.reason, { type: 'unhandled_promise_rejection' })
  })

  logger.info('Global error handlers initialized')
}

export default ErrorHandler
