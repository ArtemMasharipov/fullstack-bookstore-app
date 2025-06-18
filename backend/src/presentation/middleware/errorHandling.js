import { AppError } from '../../shared/errors/AppError.js'

export const setupErrorHandling = app => {
  // Обработка 404 ошибки
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.originalUrl} not found`,
      status: 404,
    })
  })

  // Глобальная обработка ошибок
  app.use((err, req, res, next) => {
    // Логирование ошибки
    console.error('Error occurred:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    })

    // Определение статуса ошибки
    let statusCode = 500
    let message = 'Internal Server Error'

    if (err instanceof AppError) {
      statusCode = err.statusCode
      message = err.message
    } else if (err.name === 'ValidationError') {
      statusCode = 400
      message = 'Validation Error'
    } else if (err.name === 'CastError') {
      statusCode = 400
      message = 'Invalid ID format'
    } else if (err.code === 11000) {
      statusCode = 409
      message = 'Duplicate field value'
    } else if (err.message) {
      message = err.message
    }

    // Отправка ответа
    res.status(statusCode).json({
      error: message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  })
}
