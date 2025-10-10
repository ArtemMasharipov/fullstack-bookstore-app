import { container } from '../../../shared/container/DIContainer.js'
import {
    createController
} from '../../../shared/helpers/controllerHelpers.js'

/**
 * Cart Controllers using DI Container
 * 
 * Преимущества:
 * - Устранено дублирование кода
 * - Автоматическая обработка ошибок
 * - Консистентные ответы API
 * - Легкое тестирование
 */

// Получение корзины пользователя
export const getCart = createController(
  () => container.get('getCartUseCase'),
  {
    transformRequest: (req) => req.user.id
  }
)

// Добавление товара в корзину
export const addToCart = createController(
  () => container.get('addToCartUseCase'),
  {
    transformRequest: (req) => ({
      userId: req.user.id,
      bookId: req.body.bookId,
      quantity: req.body.quantity
    })
  }
)

// Обновление количества товара в корзине
export const updateCartItem = createController(
  () => container.get('updateCartItemUseCase'),
  {
    transformRequest: (req) => ({
      userId: req.user.id,
      itemId: req.params.id,
      quantity: req.body.quantity
    })
  }
)

// Удаление товара из корзины
export const removeCartItem = createController(
  () => container.get('removeFromCartUseCase'),
  {
    transformRequest: (req) => ({
      userId: req.user.id,
      itemId: req.params.id
    })
  }
)

// Синхронизация корзины
export const syncCart = createController(
  () => container.get('syncCartUseCase'),
  {
    transformRequest: (req) => ({
      userId: req.user.id,
      items: req.body.items
    })
  }
)
