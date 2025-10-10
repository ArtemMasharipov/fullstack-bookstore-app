import {
    errorHandlingMiddleware,
    notFoundMiddleware
} from '../../shared/errors/ErrorHandler.js'

export const setupErrorHandling = app => {
  // Обработка 404 ошибки
  app.use(notFoundMiddleware)

  // Глобальная обработка ошибок
  app.use(errorHandlingMiddleware)
}
