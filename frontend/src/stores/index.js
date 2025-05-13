// Экспортируем все хранилища из одной точки для удобства использования
export { useAuthStore } from './auth'
export { useAuthorsStore } from './authors'
export { useAuthorsUiStore } from './authorsUi'
export { useAuthUiStore } from './authUi'
export { useBooksStore } from './books'
export { useBooksUiStore } from './booksUi'
export { useCartStore } from './cart'
export { useOrdersStore } from './orders'
export { useOrdersUiStore } from './ordersUi'
export { useUiStore } from './ui'
export { useUsersStore } from './users'
export { useUsersUiStore } from './usersUi'

// Импорт и экспорт улучшенного toast сервиса
import toast from '@/services/enhancedToast'
export { toast }

// Импорт и экспорт вспомогательных функций для toast
import toastHelpers from '@/services/toastHelpers'
export { toastHelpers }
