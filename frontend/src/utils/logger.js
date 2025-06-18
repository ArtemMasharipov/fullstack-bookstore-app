/**
 * Centralized logging system for the Vue.js Bookstore application
 *
 * Features:
 * - Environment-aware logging (dev vs production)
 * - Multiple log levels (debug, info, warn, error)
 * - Integration with external monitoring services
 * - Performance monitoring
 * - User context tracking
 *
 * Usage:
 * import { logger } from '@/utils/logger'
 * logger.info('User logged in', { userId: 123 })
 * logger.error('API call failed', error, { context: 'books-fetch' })
 */

// Log levels hierarchy
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
}

// Current environment configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Format timestamp for log entries
 */
const getTimestamp = () => {
    return new Date().toISOString()
}

/**
 * Format log entry for console output
 */
const formatConsoleLog = (level, message, data, context) => {
    const timestamp = getTimestamp()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    const contextStr = context ? ` [${context}]` : ''
    return {
        prefix: `${prefix}${contextStr}`,
        message,
        data,
    }
}

/**
 * Send log to external monitoring service (production)
 */
const sendToMonitoring = async (logEntry) => {
    if (!isProduction) return

    try {
        // TODO: Integrate with monitoring service (Sentry, LogRocket, etc.)
        // Example integration:
        // await fetch('/api/logs', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // })

        // For now, store in sessionStorage for debugging
        const logs = JSON.parse(sessionStorage.getItem('app_logs') || '[]')
        logs.push(logEntry)
        sessionStorage.setItem('app_logs', JSON.stringify(logs.slice(-100))) // Keep last 100 logs
    } catch (error) {
        console.error('Failed to send log to monitoring service:', error)
    }
}

/**
 * Core logging function
 */
const log = (level, message, data = null, context = null) => {
    const logEntry = {
        timestamp: getTimestamp(),
        level,
        message,
        data,
        context,
        url: window.location?.href,
        userAgent: navigator?.userAgent,
    }

    // Console output in development
    if (isDevelopment) {
        const formatted = formatConsoleLog(level, message, data, context)

        switch (level) {
            case 'DEBUG':
                console.debug(formatted.prefix, formatted.message, formatted.data || '')
                break
            case 'INFO':
                console.log(formatted.prefix, formatted.message, formatted.data || '')
                break
            case 'WARN':
                console.warn(formatted.prefix, formatted.message, formatted.data || '')
                break
            case 'ERROR':
                console.error(formatted.prefix, formatted.message, formatted.data || '')
                break
        }
    }

    // Send to monitoring in production
    if (isProduction && LOG_LEVELS[level] >= LOG_LEVELS.WARN) {
        sendToMonitoring(logEntry)
    }
}

/**
 * Logger interface
 */
export const logger = {
    /**
     * Debug level logging - for detailed diagnostic information
     * @param {string} message - Log message
     * @param {any} data - Additional data to log
     * @param {string} context - Context identifier (component name, feature, etc.)
     */
    debug: (message, data = null, context = null) => {
        log('DEBUG', message, data, context)
    },

    /**
     * Info level logging - for general information
     * @param {string} message - Log message
     * @param {any} data - Additional data to log
     * @param {string} context - Context identifier
     */
    info: (message, data = null, context = null) => {
        log('INFO', message, data, context)
    },

    /**
     * Warning level logging - for potentially harmful situations
     * @param {string} message - Log message
     * @param {any} data - Additional data to log
     * @param {string} context - Context identifier
     */
    warn: (message, data = null, context = null) => {
        log('WARN', message, data, context)
    },

    /**
     * Error level logging - for error events
     * @param {string} message - Log message
     * @param {Error|any} error - Error object or data
     * @param {string} context - Context identifier
     */
    error: (message, error = null, context = null) => {
        // Extract error information if it's an Error object
        const errorData =
            error instanceof Error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                  }
                : error

        log('ERROR', message, errorData, context)
    },

    /**
     * Performance timing logging
     * @param {string} label - Performance label
     * @param {number} duration - Duration in milliseconds
     * @param {string} context - Context identifier
     */
    performance: (label, duration, context = null) => {
        if (isDevelopment) {
            log('INFO', `Performance: ${label}`, { duration: `${duration}ms` }, context)
        }
    },

    /**
     * User action logging for analytics
     * @param {string} action - User action
     * @param {any} data - Action data
     * @param {string} context - Context identifier
     */
    userAction: (action, data = null, context = null) => {
        log('INFO', `User Action: ${action}`, data, context)
    },

    /**
     * API request logging
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {any} data - Request/response data
     * @param {string} status - Request status (success/error)
     */
    apiRequest: (method, url, data = null, status = 'success') => {
        const level = status === 'error' ? 'ERROR' : 'INFO'
        log(level, `API ${method.toUpperCase()} ${url}`, data, 'api')
    },
}

/**
 * Performance measurement helper
 */
export const performanceLogger = {
    /**
     * Start performance measurement
     * @param {string} label - Performance label
     * @returns {Function} - End function to call when measurement is complete
     */
    start: (label) => {
        const startTime = performance.now()

        return (context = null) => {
            const duration = performance.now() - startTime
            logger.performance(label, Math.round(duration), context)
            return duration
        }
    },
}

/**
 * Global error handler helper
 */
export const setupGlobalErrorLogging = (app) => {
    // Vue error handler
    app.config.errorHandler = (err, instance, info) => {
        logger.error('Vue error', err, `vue-${info}`)
    }

    // Global unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        logger.error('Unhandled promise rejection', event.reason, 'promise')
    })

    // Global error handler
    window.addEventListener('error', (event) => {
        logger.error(
            'Global error',
            {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            },
            'global'
        )
    })
}

export default logger
