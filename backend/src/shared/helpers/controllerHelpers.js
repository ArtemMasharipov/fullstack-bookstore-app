/**
 * Controller Helpers
 * Устраняет дублирование кода в контроллерах
 * 
 * Принципы:
 * - DRY: единая логика обработки ошибок и валидации
 * - Single Responsibility: каждый helper отвечает за одну задачу
 * - Consistency: одинаковое поведение во всех контроллерах
 */

import { validationResult } from 'express-validator'
import { container } from '../container/DIContainer.js'

/**
 * Обработка ошибок в контроллерах
 * @param {Object} res - Express response object
 * @param {Error} error - Ошибка
 * @param {number} defaultStatus - Статус по умолчанию
 */
export const handleErrors = (res, error, defaultStatus = 500) => {
  console.error('Controller Error:', {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    status: error.status || defaultStatus
  })

  const status = error.status || error.statusCode || defaultStatus
  const message = error.message || 'Internal Server Error'

  res.status(status).json({
    success: false,
    error: message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}

/**
 * Валидация запроса
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {boolean} - true если валидация прошла успешно
 */
export const validateRequest = (req, res) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      status: 400,
      details: errors.array()
    })
    return false
  }
  
  return true
}

/**
 * Создание контроллера с автоматической обработкой ошибок
 * @param {Function} useCaseFactory - Фабрика use case
 * @param {Object} options - Опции
 * @returns {Function} - Express middleware
 */
export const createController = (useCaseFactory, options = {}) => {
  const {
    validate = true,
    successStatus = 200,
    transformRequest = (req) => ({ params: req.params, body: req.body, user: req.user }),
    transformResponse = (result) => result
  } = options

  return async (req, res, next) => {
    try {
      // Валидация запроса
      if (validate && !validateRequest(req, res)) {
        return
      }

      // Получение use case из DI контейнера
      const useCase = useCaseFactory(container)
      
      // Подготовка данных запроса
      const requestData = transformRequest(req)
      
      // Выполнение use case
      const result = await useCase.execute(requestData)
      
      // Отправка ответа
      const responseData = transformResponse(result)
      res.status(successStatus).json({
        success: true,
        data: responseData,
        status: successStatus
      })

    } catch (error) {
      handleErrors(res, error)
    }
  }
}

/**
 * Создание контроллера для CRUD операций
 * @param {string} useCaseName - Имя use case в DI контейнере
 * @param {Object} options - Опции
 * @returns {Function} - Express middleware
 */
export const createCRUDController = (useCaseName, options = {}) => {
  return createController(
    (container) => container.get(useCaseName),
    options
  )
}

/**
 * Создание контроллера для создания ресурса
 * @param {string} useCaseName - Имя use case
 * @returns {Function} - Express middleware
 */
export const createCreateController = (useCaseName) => {
  return createCRUDController(useCaseName, {
    successStatus: 201,
    transformRequest: (req) => ({
      ...req.body,
      ...(req.file && { image: req.file.path })
    })
  })
}

/**
 * Создание контроллера для получения ресурса по ID
 * @param {string} useCaseName - Имя use case
 * @returns {Function} - Express middleware
 */
export const createGetByIdController = (useCaseName) => {
  return createCRUDController(useCaseName, {
    transformRequest: (req) => req.params.id
  })
}

/**
 * Создание контроллера для получения списка ресурсов
 * @param {string} useCaseName - Имя use case
 * @returns {Function} - Express middleware
 */
export const createGetAllController = (useCaseName) => {
  return createCRUDController(useCaseName, {
    transformRequest: (req) => req.query
  })
}

/**
 * Создание контроллера для обновления ресурса
 * @param {string} useCaseName - Имя use case
 * @returns {Function} - Express middleware
 */
export const createUpdateController = (useCaseName) => {
  return createCRUDController(useCaseName, {
    transformRequest: (req) => ({
      id: req.params.id,
      data: {
        ...req.body,
        ...(req.file && { image: req.file.path })
      }
    })
  })
}

/**
 * Создание контроллера для удаления ресурса
 * @param {string} useCaseName - Имя use case
 * @returns {Function} - Express middleware
 */
export const createDeleteController = (useCaseName) => {
  return createCRUDController(useCaseName, {
    successStatus: 204,
    transformRequest: (req) => req.params.id,
    transformResponse: () => null
  })
}

/**
 * Middleware для извлечения пользователя из токена
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware
 */
export const extractUserFromToken = (req, res, next) => {
  try {
    // Если пользователь уже извлечен в auth middleware
    if (req.user) {
      return next()
    }

    // Извлечение из заголовка Authorization
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Здесь должна быть логика декодирования JWT
      // req.user = decodeToken(token)
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Middleware для проверки прав доступа
 * @param {string|Array<string>} requiredRoles - Требуемые роли
 * @returns {Function} - Express middleware
 */
export const requireRoles = (requiredRoles) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        status: 401
      })
    }

    const userRole = req.user.role?.name || req.user.role
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        status: 403
      })
    }

    next()
  }
}
