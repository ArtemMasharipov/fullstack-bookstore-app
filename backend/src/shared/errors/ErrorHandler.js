/**
 * Centralized Error Handler
 * Единая точка обработки всех ошибок в приложении
 * 
 * Принципы:
 * - Single Responsibility: только обработка ошибок
 * - Consistency: одинаковый формат ошибок
 * - Logging: централизованное логирование
 * - Security: не раскрываем внутренние детали
 */

import logger from '../../utils/logger.js'

/**
 * Базовый класс для всех ошибок приложения
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Ошибка валидации
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = []) {
    super(message, 400)
    this.details = details
  }
}

/**
 * Ошибка "не найдено"
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

/**
 * Ошибка авторизации
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401)
  }
}

/**
 * Ошибка доступа
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403)
  }
}

/**
 * Ошибка конфликта
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409)
  }
}

/**
 * Ошибка базы данных
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500)
  }
}

/**
 * Ошибка внешнего сервиса
 */
export class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error') {
    super(`${service}: ${message}`, 502)
    this.service = service
  }
}

/**
 * Централизованный обработчик ошибок
 */
export class ErrorHandler {
  /**
   * Обработка ошибок в контроллерах
   * @param {Error} error - Ошибка
   * @param {Object} context - Контекст (req, res, next)
   * @returns {Object} - Нормализованная ошибка
   */
  static handleControllerError(error, context = {}) {
    const { req, res, next } = context

    // Логирование ошибки
    this.logError(error, req)

    // Определение типа ошибки
    const normalizedError = this.normalizeError(error)

    // Отправка ответа
    if (res) {
      this.sendErrorResponse(res, normalizedError)
    }

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
        statusCode: error.statusCode,
        message: error.message,
        name: error.name,
        timestamp: error.timestamp,
        details: error.details || null,
        isOperational: error.isOperational
      }
    }

    // Обработка ошибок Mongoose
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }))
      return {
        statusCode: 400,
        message: 'Validation failed',
        name: 'ValidationError',
        timestamp: new Date().toISOString(),
        details,
        isOperational: true
      }
    }

    // Обработка ошибок кастинга (неверный ID)
    if (error.name === 'CastError') {
      return {
        statusCode: 400,
        message: 'Invalid ID format',
        name: 'CastError',
        timestamp: new Date().toISOString(),
        details: null,
        isOperational: true
      }
    }

    // Обработка дублирования (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return {
        statusCode: 409,
        message: `${field} already exists`,
        name: 'DuplicateError',
        timestamp: new Date().toISOString(),
        details: null,
        isOperational: true
      }
    }

    // Обработка JWT ошибок
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        message: 'Invalid token',
        name: 'TokenError',
        timestamp: new Date().toISOString(),
        details: null,
        isOperational: true
      }
    }

    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        message: 'Token expired',
        name: 'TokenExpiredError',
        timestamp: new Date().toISOString(),
        details: null,
        isOperational: true
      }
    }

    // Неизвестная ошибка
    return {
      statusCode: 500,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      name: 'InternalError',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.stack : null,
      isOperational: false
    }
  }

  /**
   * Логирование ошибки
   * @param {Error} error - Ошибка
   * @param {Object} req - Express request
   */
  static logError(error, req = null) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...(req && {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      })
    }

    if (error instanceof AppError && error.isOperational) {
      logger.warn('Operational error occurred', errorInfo)
    } else {
      logger.error('Unexpected error occurred', errorInfo)
    }
  }

  /**
   * Отправка ответа с ошибкой
   * @param {Object} res - Express response
   * @param {Object} normalizedError - Нормализованная ошибка
   */
  static sendErrorResponse(res, normalizedError) {
    const response = {
      success: false,
      error: normalizedError.message,
      status: normalizedError.statusCode,
      timestamp: normalizedError.timestamp,
      ...(normalizedError.details && { details: normalizedError.details })
    }

    // В development режиме добавляем дополнительную информацию
    if (process.env.NODE_ENV === 'development') {
      response.name = normalizedError.name
      response.stack = normalizedError.details
    }

    res.status(normalizedError.statusCode).json(response)
  }

  /**
   * Обработка необработанных исключений
   */
  static handleUncaughtException() {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception! Shutting down...', error)
      process.exit(1)
    })
  }

  /**
   * Обработка необработанных промисов
   */
  static handleUnhandledRejection() {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })
  }

  /**
   * Инициализация обработчиков ошибок
   */
  static initialize() {
    this.handleUncaughtException()
    this.handleUnhandledRejection()
    logger.info('Error handlers initialized')
  }
}

/**
 * Middleware для обработки ошибок в Express
 */
export const errorHandlingMiddleware = (error, req, res, next) => {
  ErrorHandler.handleControllerError(error, { req, res, next })
}

/**
 * Middleware для обработки 404 ошибок
 */
export const notFoundMiddleware = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`)
  ErrorHandler.handleControllerError(error, { req, res, next })
}

/**
 * Async wrapper для автоматической обработки ошибок в async функциях
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
