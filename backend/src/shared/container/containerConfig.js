/**
 * Конфигурация DI контейнера
 * Регистрирует все сервисы и их зависимости
 * 
 * Принципы регистрации:
 * - Repositories: singleton (одно подключение к БД)
 * - Use Cases: transient (новый экземпляр для каждого запроса)
 * - Services: singleton (переиспользуем логику)
 */

import { container } from './DIContainer.js'

// Импорты репозиториев
import { MongoAuthorRepository } from '../../infrastructure/repositories/MongoAuthorRepository.js'
import { MongoBookRepository } from '../../infrastructure/repositories/MongoBookRepository.js'
import { MongoCartRepository } from '../../infrastructure/repositories/MongoCartRepository.js'
import { MongoOrderRepository } from '../../infrastructure/repositories/MongoOrderRepository.js'
import { MongoRoleRepository } from '../../infrastructure/repositories/MongoRoleRepository.js'
import { MongoUserRepository } from '../../infrastructure/repositories/MongoUserRepository.js'

// Импорты use cases
import {
    CreateBookUseCase,
    DeleteBookUseCase,
    GetAllBooksUseCase,
    GetBookByIdUseCase,
    UpdateBookUseCase,
} from '../../application/use-cases/BookUseCases.js'

import {
    AddToCartUseCase,
    GetCartUseCase,
    RemoveFromCartUseCase,
    SyncCartUseCase,
    UpdateCartItemUseCase,
} from '../../application/use-cases/CartUseCases.js'

import {
    CreateOrderUseCase,
    GetOrderByIdUseCase,
    GetOrdersByUserIdUseCase,
} from '../../application/use-cases/OrderUseCases.js'

import { UserUseCases } from '../../application/use-cases/UserUseCases.js'

// Импорты domain services
import { CartDomainService } from '../../domain/services/CartDomainService.js'
import { OrderDomainService } from '../../domain/services/OrderDomainService.js'
import { UserDomainService } from '../../domain/services/UserDomainService.js'

/**
 * Регистрация репозиториев как singleton
 * Обоснование: одно подключение к БД, переиспользуем экземпляры
 */
function registerRepositories() {
  container.registerSingleton('authorRepository', () => new MongoAuthorRepository())
  container.registerSingleton('bookRepository', () => new MongoBookRepository())
  container.registerSingleton('cartRepository', () => new MongoCartRepository())
  container.registerSingleton('orderRepository', () => new MongoOrderRepository())
  container.registerSingleton('roleRepository', () => new MongoRoleRepository())
  container.registerSingleton('userRepository', () => new MongoUserRepository())
}

/**
 * Регистрация domain services как singleton
 * Обоснование: бизнес-логика не имеет состояния, переиспользуем
 */
function registerDomainServices() {
  container.registerSingleton('cartDomainService', () => CartDomainService)
  container.registerSingleton('orderDomainService', () => OrderDomainService)
  container.registerSingleton('userDomainService', () => UserDomainService)
}

/**
 * Регистрация use cases как transient
 * Обоснование: каждый запрос должен иметь свой экземпляр для изоляции
 */
function registerUseCases() {
  // Book Use Cases
  container.registerTransient('createBookUseCase', () => {
    const bookRepository = container.get('bookRepository')
    const authorRepository = container.get('authorRepository')
    return new CreateBookUseCase(bookRepository, authorRepository)
  })

  container.registerTransient('getAllBooksUseCase', () => {
    const bookRepository = container.get('bookRepository')
    return new GetAllBooksUseCase(bookRepository)
  })

  container.registerTransient('getBookByIdUseCase', () => {
    const bookRepository = container.get('bookRepository')
    return new GetBookByIdUseCase(bookRepository)
  })

  container.registerTransient('updateBookUseCase', () => {
    const bookRepository = container.get('bookRepository')
    const authorRepository = container.get('authorRepository')
    return new UpdateBookUseCase(bookRepository, authorRepository)
  })

  container.registerTransient('deleteBookUseCase', () => {
    const bookRepository = container.get('bookRepository')
    return new DeleteBookUseCase(bookRepository)
  })

  // Cart Use Cases
  container.registerTransient('getCartUseCase', () => {
    const cartRepository = container.get('cartRepository')
    return new GetCartUseCase(cartRepository)
  })

  container.registerTransient('addToCartUseCase', () => {
    const cartRepository = container.get('cartRepository')
    const bookRepository = container.get('bookRepository')
    return new AddToCartUseCase(cartRepository, bookRepository)
  })

  container.registerTransient('removeFromCartUseCase', () => {
    const cartRepository = container.get('cartRepository')
    return new RemoveFromCartUseCase(cartRepository)
  })

  container.registerTransient('updateCartItemUseCase', () => {
    const cartRepository = container.get('cartRepository')
    return new UpdateCartItemUseCase(cartRepository)
  })

  container.registerTransient('syncCartUseCase', () => {
    const cartRepository = container.get('cartRepository')
    return new SyncCartUseCase(cartRepository)
  })

  // Order Use Cases
  container.registerTransient('createOrderUseCase', () => {
    const orderRepository = container.get('orderRepository')
    const cartRepository = container.get('cartRepository')
    return new CreateOrderUseCase(orderRepository, cartRepository)
  })

  container.registerTransient('getOrderByIdUseCase', () => {
    const orderRepository = container.get('orderRepository')
    return new GetOrderByIdUseCase(orderRepository)
  })

  container.registerTransient('getOrdersByUserIdUseCase', () => {
    const orderRepository = container.get('orderRepository')
    return new GetOrdersByUserIdUseCase(orderRepository)
  })

  // User Use Cases (legacy class)
  container.registerTransient('userUseCases', () => {
    const userRepository = container.get('userRepository')
    return new UserUseCases()
  })
}

/**
 * Инициализация контейнера
 * Вызывается при старте приложения
 */
export function initializeContainer() {
  console.log('🔧 Initializing DI Container...')
  
  registerRepositories()
  registerDomainServices()
  registerUseCases()
  
  console.log('✅ DI Container initialized with services:', container.getRegisteredServices())
}

/**
 * Получение контейнера для использования в контроллерах
 */
export { container }
export default container
