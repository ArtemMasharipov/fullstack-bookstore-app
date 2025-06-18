import { useNotifications } from '@/composables/useNotifications'

/**
 * Professional notification service based on Vuetify
 * Provides a clean API compatible with existing codebase
 */
class NotificationService {
    constructor() {
        const { success, error, warning, info, show } = useNotifications()
        this.success = success
        this.error = error
        this.warning = warning
        this.info = info
        this.show = show

        // Common notifications
        this.loginSuccess = () => this.success('Успешный вход в систему')
        this.logoutSuccess = () => this.success('Вы вышли из системы')
        this.registrationSuccess = () => this.success('Регистрация успешно завершена')

        // Cart notifications
        this.addedToCart = (title) => this.success(`"${title}" добавлен в корзину`)
        this.removedFromCart = (title) => this.info(`"${title}" удален из корзины`)
        this.cartUpdated = () => this.info('Корзина обновлена')
        this.cartCleared = () => this.info('Корзина очищена')
        this.orderPlaced = () => this.success('Заказ успешно оформлен')

        // API notifications
        this.apiError = (message) => this.error(message || 'Произошла ошибка. Попробуйте позже.')
        this.apiSuccess = (message) => this.success(message || 'Операция выполнена успешно')
        this.dataLoaded = () => this.success('Данные успешно загружены')

        // CRUD operations
        this.itemCreated = (item) => this.success(`${item} успешно создан`)
        this.itemUpdated = (item) => this.success(`${item} успешно обновлен`)
        this.itemDeleted = (item) => this.info(`${item} удален`)
    }
}

// Export singleton instance
export const notificationService = new NotificationService()

// Export individual methods for convenience
export const {
    success,
    error,
    warning,
    info,
    show,
    loginSuccess,
    logoutSuccess,
    registrationSuccess,
    addedToCart,
    removedFromCart,
    cartUpdated,
    cartCleared,
    orderPlaced,
    apiError,
    apiSuccess,
    dataLoaded,
    itemCreated,
    itemUpdated,
    itemDeleted,
} = notificationService
