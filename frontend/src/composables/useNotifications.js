import { computed, ref, watch } from 'vue'

/**
 * Global notification state
 */
const notifications = ref([])

/**
 * Maximum number of visible notifications at once
 */
const MAX_VISIBLE = 5

/**
 * Queue for pending notifications when too many are shown
 */
const notificationQueue = ref([])

/**
 * Composable for managing Vuetify-based toast notifications
 * Professional, laconic, and elegant notification system
 */
export function useNotifications() {
    /**
     * Create a unique ID for each notification
     */
    const createId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    /**
     * Process the notification queue
     */
    const processQueue = () => {
        if (notificationQueue.value.length > 0 && notifications.value.length < MAX_VISIBLE) {
            const next = notificationQueue.value.shift()
            notifications.value.push(next)

            // Auto-hide non-persistent notifications
            if (!next.persistent && next.timeout > 0) {
                setTimeout(() => {
                    hide(next.id)
                }, next.timeout)
            }
        }
    }

    /**
     * Show a notification
     */
    const show = ({
        message,
        type = 'info',
        timeout = 4000,
        persistent = false,
        actions = [],
        html = false,
        group = null,
    }) => {
        // If group is specified, clear other notifications in this group
        if (group) {
            clearGroup(group)
        }

        const notification = {
            id: createId(),
            message,
            type,
            timeout,
            persistent,
            actions,
            html,
            group,
            show: true,
        }

        // If too many notifications, queue this one
        if (notifications.value.length >= MAX_VISIBLE) {
            notificationQueue.value.push(notification)
            return notification.id
        }

        notifications.value.push(notification)

        // Auto-hide non-persistent notifications
        if (!persistent && timeout > 0) {
            setTimeout(() => {
                hide(notification.id)
            }, timeout)
        }

        return notification.id
    }

    /**
     * Hide a specific notification
     */
    const hide = (id) => {
        const index = notifications.value.findIndex((n) => n.id === id)
        if (index > -1) {
            notifications.value.splice(index, 1)

            // Process any queued notifications
            setTimeout(processQueue, 300)
        }
    }

    /**
     * Clear all notifications
     */
    const clear = () => {
        notifications.value.splice(0)
        notificationQueue.value.splice(0)
    }

    /**
     * Clear notifications by group
     */
    const clearGroup = (group) => {
        if (!group) return

        // Clear visible notifications in this group
        const toRemove = notifications.value.filter((n) => n.group === group).map((n) => n.id)

        toRemove.forEach((id) => hide(id))

        // Clear queued notifications in this group
        const queueIndex = notificationQueue.value.findIndex((n) => n.group === group)
        if (queueIndex > -1) {
            notificationQueue.value.splice(queueIndex, 1)
        }
    }

    /**
     * Convenience methods for different notification types
     */
    const success = (message, options = {}) => show({ message, type: 'success', ...options })

    const error = (message, options = {}) => show({ message, type: 'error', persistent: true, ...options })

    const warning = (message, options = {}) => show({ message, type: 'warning', ...options })

    const info = (message, options = {}) => show({ message, type: 'info', ...options })

    // Watch for changes in notification list to process queue
    watch(
        () => notifications.value.length,
        (newLength, oldLength) => {
            if (newLength < oldLength && notificationQueue.value.length > 0) {
                processQueue()
            }
        }
    )

    return {
        notifications: computed(() => notifications.value),
        show,
        hide,
        clear,
        clearGroup,
        success,
        error,
        warning,
        info,
        // Aliases for backward compatibility
        showSuccess: success,
        showError: error,
        showWarning: warning,
        showInfo: info,
    }
}
