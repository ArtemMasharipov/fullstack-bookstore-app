/**
 * Centralized Error Handler for Frontend
 * Single point for handling all errors in the frontend app
 *
 * Principles:
 * - Single Responsibility: handles errors only
 * - Consistency: uniform error format
 * - User Experience: clear messages for users
 * - Logging: centralized logging
 */

import { logger } from './logger'

/**
 * Error types
 */
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    AUTHENTICATION: 'AUTHENTICATION_ERROR',
    AUTHORIZATION: 'AUTHORIZATION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    SERVER: 'SERVER_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR',
}

/**
 * HTTP error codes
 */
export const HTTP_STATUS = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
}

/**
 * Application error class
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
 * Centralized error handler
 */
export class ErrorHandler {
    /**
     * Handle an error
     * @param {Error|AppError} error - Error
     * @param {Object} context - Context (component, action)
     * @returns {Object} - Normalized error
     */
    static handle(error, context = {}) {
        // Error logging
        this.logError(error, context)

        // Error normalization
        const normalizedError = this.normalizeError(error)

        // Return normalized error
        return normalizedError
    }

    /**
     * Error normalization
     * @param {Error} error - Original error
     * @returns {Object} - Normalized error
     */
    static normalizeError(error) {
        // If this is already an AppError
        if (error instanceof AppError) {
            return {
                type: error.type,
                message: error.message,
                statusCode: error.statusCode,
                details: error.details,
                timestamp: error.timestamp,
                userMessage: this.getUserMessage(error.type, error.message),
            }
        }

        // Handle network errors
        if (error.message === 'Network Error' || !error.response) {
            return {
                type: ERROR_TYPES.NETWORK,
                message: 'Network connection error',
                statusCode: 0,
                details: error.message,
                timestamp: new Date().toISOString(),
                userMessage: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
            }
        }

        // Handle HTTP errors
        if (error.response) {
            const { status, data } = error.response

            return {
                type: this.getErrorType(status),
                message: data?.message || data?.error || 'Server error',
                statusCode: status,
                details: data,
                timestamp: new Date().toISOString(),
                userMessage: this.getUserMessage(this.getErrorType(status), data?.message),
            }
        }

        // Unknown error
        return {
            type: ERROR_TYPES.UNKNOWN,
            message: error.message || 'Unknown error occurred',
            statusCode: 500,
            details: error.stack,
            timestamp: new Date().toISOString(),
            userMessage: 'Произошла неизвестная ошибка. Попробуйте обновить страницу.',
        }
    }

    /**
     * Determine error type by status
     * @param {number} status - HTTP status
     * @returns {string} - Error type
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
     * Get user-facing message
     * @param {string} type - Error type
     * @param {string} message - Error message
     * @returns {string} - User-facing message
     */
    static getUserMessage(type, message) {
        const messages = {
            [ERROR_TYPES.NETWORK]: 'Проблема с подключением к интернету. Проверьте соединение и попробуйте снова.',
            [ERROR_TYPES.VALIDATION]: message || 'Проверьте правильность введенных данных.',
            [ERROR_TYPES.AUTHENTICATION]: 'Необходимо войти в систему.',
            [ERROR_TYPES.AUTHORIZATION]: 'У вас нет прав для выполнения этого действия.',
            [ERROR_TYPES.NOT_FOUND]: 'Запрашиваемый ресурс не найден.',
            [ERROR_TYPES.SERVER]: 'Временные проблемы с сервером. Попробуйте позже.',
            [ERROR_TYPES.UNKNOWN]: 'Произошла неизвестная ошибка. Попробуйте обновить страницу.',
        }

        return messages[type] || messages[ERROR_TYPES.UNKNOWN]
    }

    /**
     * Error logging
     * @param {Error} error - Error
     * @param {Object} context - Context
     */
    static logError(error, context = {}) {
        const errorInfo = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            context,
            url: window.location?.href,
            userAgent: navigator.userAgent,
        }

        if (error instanceof AppError) {
            logger.warn('Application error occurred', errorInfo)
        } else {
            logger.error('Unexpected error occurred', errorInfo)
        }
    }

    /**
     * Create validation error
     * @param {string} message - Message
     * @param {Object} details - Details
     * @returns {AppError}
     */
    static createValidationError(message, details = null) {
        return new AppError(message, ERROR_TYPES.VALIDATION, HTTP_STATUS.BAD_REQUEST, details)
    }

    /**
     * Create authentication error
     * @param {string} message - Message
     * @returns {AppError}
     */
    static createAuthError(message = 'Authentication required') {
        return new AppError(message, ERROR_TYPES.AUTHENTICATION, HTTP_STATUS.UNAUTHORIZED)
    }

    /**
     * Create authorization error
     * @param {string} message - Message
     * @returns {AppError}
     */
    static createAuthorizationError(message = 'Access forbidden') {
        return new AppError(message, ERROR_TYPES.AUTHORIZATION, HTTP_STATUS.FORBIDDEN)
    }

    /**
     * Create not-found error
     * @param {string} message - Message
     * @returns {AppError}
     */
    static createNotFoundError(message = 'Resource not found') {
        return new AppError(message, ERROR_TYPES.NOT_FOUND, HTTP_STATUS.NOT_FOUND)
    }

    /**
     * Create network error
     * @param {string} message - Message
     * @returns {AppError}
     */
    static createNetworkError(message = 'Network error') {
        return new AppError(message, ERROR_TYPES.NETWORK, 0)
    }
}

/**
 * Hook for handling errors in Vue components
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
        HTTP_STATUS,
    }
}

/**
 * Global handler for uncaught errors
 */
export function setupGlobalErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        ErrorHandler.handle(event.error, { type: 'unhandled_error' })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        ErrorHandler.handle(event.reason, { type: 'unhandled_promise_rejection' })
    })

    logger.info('Global error handlers initialized')
}

export default ErrorHandler
