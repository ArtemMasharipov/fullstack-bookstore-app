import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotifications } from './useNotifications'
import { notificationService, addedToCart, apiError } from '@/services/notificationService'

const notices = useNotifications()
beforeEach(() => {
    vi.useFakeTimers()
    notices.clear()
})
afterEach(() => {
    notices.clear()
    vi.clearAllTimers()
    vi.useRealTimers()
})
describe('notification state and compatibility', () => {
    it('retains translation descriptors in both open and queued notices', async () => {
        for (let i = 0; i < 5; i++)
            notices.show({
                messageKey: 'notifications.cartAdded',
                messageParams: { title: 'Book ' + i },
                persistent: true,
            })
        const id = notices.show({
            messageKey: 'notifications.cartAdded',
            messageParams: { title: 'Queued' },
            actions: [{ labelKey: 'errors.retry', labelParams: { count: 2 }, keepOpen: true }],
            timeout: 1000,
        })
        expect(notices.notifications.value[0]).toMatchObject({
            messageKey: 'notifications.cartAdded',
            messageParams: { title: 'Book 0' },
        })
        notices.hide(notices.notifications.value[0].id)
        await vi.advanceTimersByTimeAsync(300)
        expect(notices.notifications.value.find((n) => n.id === id)).toMatchObject({
            messageKey: 'notifications.cartAdded',
            messageParams: { title: 'Queued' },
            actions: [{ labelKey: 'errors.retry', labelParams: { count: 2 }, keepOpen: true }],
        })
        await vi.advanceTimersByTimeAsync(1000)
        expect(notices.notifications.value.some((n) => n.id === id)).toBe(false)
    })
    it('preserves wrappers, aliases, option overrides and group replacement', () => {
        notices.showError('legacy', {
            messageKey: 'errors.CONFLICT',
            type: 'info',
            persistent: false,
            timeout: 0,
            group: 'request',
        })
        expect(notices.notifications.value[0]).toMatchObject({
            message: 'legacy',
            messageKey: 'errors.CONFLICT',
            type: 'info',
            persistent: false,
        })
        notices.info('replacement', { group: 'request' })
        expect(notices.notifications.value).toHaveLength(1)
        expect(notices.notifications.value[0].message).toBe('replacement')
    })
    it('singleton and destructured producers retain keys instead of frozen copy or raw server errors', () => {
        addedToCart('Local book')
        notificationService.logoutSuccess()
        apiError({ data: { error: { code: 'CONFLICT', message: 'private sentinel' } } })
        expect(notices.notifications.value).toMatchObject([
            { messageKey: 'notifications.cartAdded', messageParams: { title: 'Local book' } },
            { messageKey: 'notifications.logoutSuccess' },
            { messageKey: 'errors.CONFLICT' },
        ])
    })
})

it('cart and auth producers pass descriptors while retaining string store errors and rollback', async () => {
    const { createPinia, setActivePinia } = await import('pinia')
    const { useCartStore } = await import('@/stores/cart')
    const { useAuthStore } = await import('@/stores/auth')
    const { default: baseApi } = await import('@/services/api/baseApi')
    setActivePinia(createPinia())
    localStorage.clear()
    const cart = useCartStore()
    await cart.addToCart({ bookId: 'book', title: 'Local book', price: 299.9 })
    expect(notices.notifications.value[0]).toMatchObject({
        messageKey: 'notifications.cartAdded',
        messageParams: { title: 'Local book' },
    })
    localStorage.setItem('token', 'local-demo-token')
    const adapter = baseApi.defaults.adapter
    baseApi.defaults.adapter = async (config) => {
        throw {
            response: {
                status: 409,
                data: { error: { code: 'CONFLICT', message: 'private sentinel' } },
                config,
                headers: {},
            },
        }
    }
    try {
        await cart.updateQuantity({ itemId: 'book', quantity: 2 })
        expect(cart.items[0].quantity).toBe(1)
        expect(notices.notifications.value.at(-1).messageKey).toBe('errors.CONFLICT')
        await expect(cart.fetchCart()).rejects.toBeInstanceOf(Error)
        expect(typeof cart.error).toBe('string')
        const auth = useAuthStore()
        await auth.logout()
        expect(notices.notifications.value.at(-1).messageKey).toBe('errors.CONFLICT')
        expect(auth.token).toBeNull()
    } finally {
        baseApi.defaults.adapter = adapter
        localStorage.clear()
    }
})
