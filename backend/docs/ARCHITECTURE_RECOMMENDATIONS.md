# Модернизация архитектуры API

После анализа текущей структуры API в проекте (раздел `/backend`), этот документ предлагает архитектурные улучшения для обеспечения лучшей масштабируемости, поддерживаемости и согласованности кодовой базы.

## 1. Реорганизация структуры проекта

### Текущее состояние
Текущая структура проекта имеет некоторую организацию, но может быть улучшена для лучшего разделения ответственности.

### Рекомендации

```
backend/
├── src/                      # Весь исходный код приложения
│   ├── api/                  # API endpoints
│   │   ├── v1/               # API версия 1
│   │   │   ├── controllers/  # Контроллеры API
│   │   │   ├── routes/       # Маршруты API
│   │   │   └── index.mjs     # Экспорт всех маршрутов API v1
│   │   └── index.mjs         # Настройка и экспорт всех версий API
│   ├── domain/               # Бизнес-логика и доменные модели
│   │   ├── books/            # Книги - доменные сервисы и модели
│   │   ├── authors/          # Авторы - доменные сервисы и модели
│   │   ├── cart/             # Корзина - доменные сервисы и модели
│   │   └── users/            # Пользователи - доменные сервисы и модели
│   ├── infrastructure/       # Инфраструктурный код
│   │   ├── database/         # Работа с базой данных
│   │   │   ├── models/       # Mongoose модели
│   │   │   ├── repositories/ # Репозитории для работы с данными
│   │   │   └── index.mjs     # Подключение к БД и экспорт моделей
│   │   ├── services/         # Общие сервисы
│   │   │   ├── auth/         # Аутентификация и авторизация
│   │   │   ├── storage/      # Работа с хранилищем файлов
│   │   │   ├── cache/        # Кэширование
│   │   │   └── logger/       # Логирование
│   │   ├── middleware/       # Middleware для Express
│   │   └── config/           # Конфигурация приложения
│   └── app.mjs               # Входная точка приложения
├── test/                     # Тесты
│   ├── unit/                 # Модульные тесты
│   ├── integration/          # Интеграционные тесты
│   ├── api/                  # API тесты
│   └── fixtures/             # Тестовые данные
├── scripts/                  # Скрипты для разработки и деплоя
├── logs/                     # Логи (добавить в .gitignore)
├── package.json
└── README.md
```

### Преимущества
- Четкое разделение между API, бизнес-логикой и инфраструктурой
- Легче поддерживать разные версии API
- Улучшенная возможность повторного использования кода
- Упрощенное тестирование

## 2. Внедрение слоя репозиториев

### Текущее состояние
Модели MongoDB используются напрямую в контроллерах, что создает сильную связанность.

### Рекомендации
Внедрить слой репозиториев для абстракции доступа к данным:

```javascript
// infrastructure/database/repositories/bookRepository.mjs
import { Book } from '../models/book.mjs';

export class BookRepository {
  async findAll(filters = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    
    return Book.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
  }

  async findById(id) {
    return Book.findById(id).lean();
  }

  async create(bookData) {
    const book = new Book(bookData);
    return book.save();
  }

  async update(id, bookData) {
    return Book.findByIdAndUpdate(
      id, 
      bookData,
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return Book.findByIdAndDelete(id);
  }
}
```

### Использование в доменных сервисах

```javascript
// domain/books/bookService.mjs
import { BookRepository } from '../../infrastructure/database/repositories/bookRepository.mjs';

export class BookService {
  constructor() {
    this.bookRepository = new BookRepository();
  }

  async getAllBooks(filters, options) {
    // Дополнительная бизнес-логика...
    return this.bookRepository.findAll(filters, options);
  }

  async getBookById(id) {
    return this.bookRepository.findById(id);
  }

  // Другие методы...
}
```

## 3. Централизованная обработка ошибок

### Текущее состояние
Обработка ошибок может быть не систематической во всем приложении.

### Рекомендации
Создать централизованный механизм обработки ошибок:

```javascript
// infrastructure/errors/AppError.mjs
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// infrastructure/middleware/errorHandler.mjs
import { AppError } from '../errors/AppError.mjs';

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error
    console.error('ERROR 💥', err);

    // Send generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

// Обработчики конкретных ошибок...
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// ...другие обработчики ошибок
```

## 4. Внедрение DI (Dependency Injection)

### Текущее состояние
Компоненты приложения создают свои зависимости напрямую.

### Рекомендации
Внедрить простой контейнер DI:

```javascript
// infrastructure/di/container.mjs
class Container {
  constructor() {
    this.services = {};
    this.singletons = {};
  }

  register(name, definition, dependencies = []) {
    this.services[name] = { definition, dependencies };
  }

  singleton(name, definition, dependencies = []) {
    this.register(name, definition, dependencies);
    this.singletons[name] = true;
  }

  get(name) {
    const service = this.services[name];
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }

    // Return cached singleton instance if exists
    if (this.singletons[name] && this.singletons[name] !== true) {
      return this.singletons[name];
    }

    // Resolve dependencies
    const dependencies = service.dependencies.map(dep => this.get(dep));
    
    // Create instance
    const instance = typeof service.definition === 'function' 
      ? new service.definition(...dependencies) 
      : service.definition;

    // Cache singleton instance
    if (this.singletons[name] === true) {
      this.singletons[name] = instance;
    }

    return instance;
  }
}

export const container = new Container();
```

### Настройка и использование DI

```javascript
// setup/di.mjs
import { container } from '../infrastructure/di/container.mjs';
import { BookRepository } from '../infrastructure/database/repositories/bookRepository.mjs';
import { BookService } from '../domain/books/bookService.mjs';
import { BookController } from '../api/v1/controllers/bookController.mjs';

export function setupDI() {
  // Repositories
  container.register('bookRepository', BookRepository);
  
  // Services
  container.singleton('bookService', BookService, ['bookRepository']);
  
  // Controllers
  container.register('bookController', BookController, ['bookService']);

  // ... регистрация других зависимостей
  
  return container;
}
```

### Использование в API

```javascript
// api/v1/routes/bookRoutes.mjs
import express from 'express';
import { container } from '../../../infrastructure/di/container.mjs';

const router = express.Router();
const bookController = container.get('bookController');

router.get('/', bookController.getAllBooks.bind(bookController));
router.get('/:id', bookController.getBook.bind(bookController));
// ...другие маршруты

export default router;
```

## 5. Расширенная валидация

### Текущее состояние
Базовая валидация с помощью middleware.

### Рекомендации
Использовать Joi или Yup для более гибкой и расширяемой валидации:

```javascript
// infrastructure/validation/validators/bookValidator.mjs
import Joi from 'joi';

const bookSchema = Joi.object({
  title: Joi.string().min(2).max(100).required()
    .messages({
      'string.base': `"title" должно быть текстом`,
      'string.empty': `"title" не должно быть пустым`,
      'string.min': `"title" должно содержать минимум {#limit} символов`,
      'string.max': `"title" должно содержать максимум {#limit} символов`,
      'any.required': `"title" обязательно для заполнения`
    }),
  
  price: Joi.number().min(0).required()
    .messages({
      'number.base': `"price" должно быть числом`,
      'number.min': `"price" должно быть положительным числом`,
      'any.required': `"price" обязательно для заполнения`
    }),
  
  // другие поля...
});

export const validateBook = (data) => bookSchema.validate(data, { abortEarly: false });
```

### Middleware для валидации

```javascript
// infrastructure/middleware/validationMiddleware.mjs
import { AppError } from '../errors/AppError.mjs';

export const validate = (validator) => {
  return (req, res, next) => {
    const { error } = validator(req.body);
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessages, 400));
    }
    
    next();
  };
};
```

### Использование в маршрутах

```javascript
// api/v1/routes/bookRoutes.mjs
import { validate } from '../../../infrastructure/middleware/validationMiddleware.mjs';
import { validateBook } from '../../../infrastructure/validation/validators/bookValidator.mjs';

router.post('/', validate(validateBook), bookController.createBook.bind(bookController));
```

## 6. Внедрение логирования

### Текущее состояние
Базовое или неструктурированное логирование.

### Рекомендации
Внедрить структурированное логирование с помощью Winston:

```javascript
// infrastructure/services/logger/index.mjs
import winston from 'winston';
import path from 'path';
import config from '../../config/index.mjs';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

// Определение форматов для разных сред
const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

const productionFormat = combine(
  timestamp(),
  json()
);

// Настройка транспортов
const devTransports = [
  new transports.Console()
];

const prodTransports = [
  new transports.File({ 
    filename: path.join(config.logsDir, 'error.log'), 
    level: 'error'
  }),
  new transports.File({ 
    filename: path.join(config.logsDir, 'combined.log') 
  }),
];

// Создание логгера
const logger = createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: config.env === 'development' ? developmentFormat : productionFormat,
  transports: config.env === 'development' ? devTransports : prodTransports,
});

export default logger;
```

## 7. Асинхронная обработка операций

### Текущее состояние
Синхронная обработка всех операций.

### Рекомендации
Внедрить обработку фоновых задач с помощью Bull:

```javascript
// infrastructure/services/queue/index.mjs
import Queue from 'bull';
import config from '../../config/index.mjs';
import logger from '../logger/index.mjs';

// Создание именованных очередей
export const createQueue = (name) => {
  const queue = new Queue(name, {
    redis: config.redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      },
      removeOnComplete: true,
      removeOnFail: false
    }
  });

  // Обработка событий очереди
  queue.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`, { queue: name, jobId: job.id });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed`, { 
      queue: name, 
      jobId: job.id,
      error: err.message,
      stack: err.stack
    });
  });

  return queue;
};

// Очереди для разных операций
export const emailQueue = createQueue('email');
export const reportQueue = createQueue('report');
// ... другие очереди
```

### Использование очереди в сервисах

```javascript
// domain/orders/orderService.mjs
import { emailQueue } from '../../infrastructure/services/queue/index.mjs';

export class OrderService {
  // ...

  async createOrder(orderData) {
    const order = await this.orderRepository.create(orderData);
    
    // Отправка письма в асинхронной очереди
    await emailQueue.add('orderConfirmation', { 
      orderId: order._id,
      email: orderData.email,
      items: orderData.items
    });
    
    return order;
  }
  
  // ...
}
```

### Процессор очереди

```javascript
// scripts/workers/email-worker.mjs
import { emailQueue } from '../../infrastructure/services/queue/index.mjs';
import { EmailService } from '../../infrastructure/services/email/emailService.mjs';
import logger from '../../infrastructure/services/logger/index.mjs';

const emailService = new EmailService();

// Обработчик задач очереди
emailQueue.process('orderConfirmation', async (job) => {
  const { orderId, email, items } = job.data;
  
  logger.info(`Processing order confirmation email for order ${orderId}`);
  
  await emailService.sendOrderConfirmation(email, orderId, items);
  
  return { success: true };
});

// Обработка других типов email-задач
// ...

logger.info('Email worker started');
```

## 8. Кэширование

### Текущее состояние
Отсутствие или минимальное кэширование.

### Рекомендации
Внедрить кэширование с Redis:

```javascript
// infrastructure/services/cache/index.mjs
import Redis from 'ioredis';
import logger from '../logger/index.mjs';
import config from '../../config/index.mjs';

class CacheService {
  constructor() {
    this.client = new Redis(config.redis);
    
    this.client.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
    });
    
    this.client.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }
  
  async get(key) {
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }
  
  async set(key, value, ttl = 3600) {
    try {
      await this.client.set(
        key,
        JSON.stringify(value),
        'EX',
        ttl
      );
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }
  
  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }
  
  async flush() {
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }
}

export const cacheService = new CacheService();
```

### Middleware для кэширования ответов API

```javascript
// infrastructure/middleware/cacheMiddleware.mjs
import { cacheService } from '../services/cache/index.mjs';

export const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedData = await cacheService.get(key);
      
      if (cachedData) {
        return res.status(200).json(cachedData);
      }
      
      // Сохраняем оригинальный метод отправки ответа
      const sendResponse = res.json;
      
      // Переопределяем метод для перехвата ответа
      res.json = function(data) {
        // Восстанавливаем оригинальный метод
        res.json = sendResponse;
        
        // Кэшируем данные
        cacheService.set(key, data, ttl);
        
        // Отправляем ответ
        return sendResponse.call(this, data);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

### Использование в маршрутах

```javascript
// api/v1/routes/bookRoutes.mjs
import { cacheMiddleware } from '../../../infrastructure/middleware/cacheMiddleware.mjs';

// Кэширование списка книг на 10 минут
router.get('/', cacheMiddleware(600), bookController.getAllBooks.bind(bookController));
```

## 9. Управление транзакциями

### Текущее состояние
Отсутствие или минимальное управление транзакциями.

### Рекомендации
Внедрить службу управления транзакциями для атомарных операций:

```javascript
// infrastructure/database/transactionManager.mjs
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError.mjs';

export class TransactionManager {
  async executeTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw new AppError(
        error.message || 'Transaction failed',
        error.statusCode || 500,
        error.isOperational || false
      );
    } finally {
      session.endSession();
    }
  }
}
```

### Использование в сервисах

```javascript
// domain/orders/orderService.mjs
import { TransactionManager } from '../../infrastructure/database/transactionManager.mjs';

export class OrderService {
  constructor(orderRepository, bookRepository, userRepository) {
    this.orderRepository = orderRepository;
    this.bookRepository = bookRepository;
    this.userRepository = userRepository;
    this.transactionManager = new TransactionManager();
  }

  async placeOrder(userId, orderData) {
    return this.transactionManager.executeTransaction(async (session) => {
      // 1. Проверяем наличие товаров
      const bookIds = orderData.items.map(item => item.bookId);
      const books = await this.bookRepository.findByIds(bookIds, { session });
      
      // Проверка наличия всех книг и достаточного количества
      for (const item of orderData.items) {
        const book = books.find(b => b._id.toString() === item.bookId);
        
        if (!book) {
          throw new AppError(`Book with id ${item.bookId} not found`, 404);
        }
        
        if (book.stock < item.quantity) {
          throw new AppError(`Not enough stock for book '${book.title}'`, 400);
        }
      }
      
      // 2. Обновляем stock книг
      for (const item of orderData.items) {
        await this.bookRepository.updateStock(
          item.bookId, 
          { $inc: { stock: -item.quantity } },
          { session }
        );
      }
      
      // 3. Создаем заказ
      const order = await this.orderRepository.create(
        {
          user: userId,
          items: orderData.items,
          total: orderData.total,
          // другие поля заказа...
        },
        { session }
      );
      
      // 4. Обновляем историю заказов пользователя
      await this.userRepository.updateOrderHistory(
        userId,
        { $push: { orders: order._id } },
        { session }
      );
      
      return order;
    });
  }
}
```

## 10. API-документация

### Текущее состояние
Отсутствие или минимальная документация API.

### Рекомендации
Внедрить Swagger/OpenAPI для автоматической документации:

```javascript
// infrastructure/middleware/swagger.mjs
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import config from '../config/index.mjs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bookstore API',
      version: '1.0.0',
      description: 'Bookstore API documentation',
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/api/v1/routes/*.mjs', './src/domain/*/*.mjs'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

### Документирование маршрутов и моделей

```javascript
// api/v1/routes/bookRoutes.mjs

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     description: Retrieve a list of all books with pagination, sorting and filtering options
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: A list of books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 */
router.get('/', bookController.getAllBooks.bind(bookController));
```

## Заключение

Внедрение предложенных архитектурных решений значительно улучшит масштабируемость, поддерживаемость и лаконичность кодовой базы бэкенда. Рекомендуется внедрять их постепенно, начиная с наиболее критичных областей:

1. **Первый этап**: Реорганизация структуры проекта
2. **Второй этап**: Внедрение слоя репозиториев и централизованной обработки ошибок
3. **Третий этап**: Внедрение управления транзакциями и расширенной валидации
4. **Четвертый этап**: Внедрение кэширования и асинхронной обработки операций
5. **Пятый этап**: Внедрение логирования и документации API

Эти изменения можно внедрять поэтапно, что позволит минимизировать риски и обеспечит непрерывную работу приложения.
