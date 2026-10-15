import { useNotifications } from '@/composables/useNotifications'
import { resolveErrorKey } from '@/utils/errorResolver'

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

        this.loginSuccess = () => this.success(undefined, { messageKey: 'notifications.loginSuccess' })
        this.logoutSuccess = () => this.success(undefined, { messageKey: 'notifications.logoutSuccess' })
        this.registrationSuccess = () => this.success(undefined, { messageKey: 'notifications.registrationSuccess' })
        this.addedToCart = (title) =>
            this.success(undefined, { messageKey: 'notifications.cartAdded', messageParams: { title } })
        this.removedFromCart = (title) =>
            this.info(undefined, { messageKey: 'notifications.cartRemoved', messageParams: { title } })
        this.cartUpdated = () => this.info(undefined, { messageKey: 'notifications.cartUpdated' })
        this.cartCleared = () => this.info(undefined, { messageKey: 'notifications.cartCleared' })
        this.orderPlaced = () => this.success(undefined, { messageKey: 'notifications.orderPlaced' })
        this.apiError = (error) => this.error(undefined, { messageKey: resolveErrorKey(error) })
        this.apiSuccess = (message) => this.success(message, message ? {} : { messageKey: 'notifications.apiSuccess' })
        this.dataLoaded = () => this.success(undefined, { messageKey: 'notifications.dataLoaded' })
        this.itemCreated = (item) =>
            this.success(undefined, { messageKey: 'notifications.itemCreated', messageParams: { item } })
        this.itemUpdated = (item) =>
            this.success(undefined, { messageKey: 'notifications.itemUpdated', messageParams: { item } })
        this.itemDeleted = (item) =>
            this.info(undefined, { messageKey: 'notifications.itemDeleted', messageParams: { item } })
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
