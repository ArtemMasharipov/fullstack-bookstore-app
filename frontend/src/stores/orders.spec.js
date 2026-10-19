import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
    list: vi.fn(),
    get: vi.fn(),
    cancel: vi.fn(),
    adminList: vi.fn(),
    adminStats: vi.fn(),
    adminSetStatus: vi.fn(),
}))
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() }))

vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { useOrdersStore } from './orders'

const summary = (id, status = 'pending') => ({ id, orderNumber: `ORD-${id}`, status, paymentStatus: 'unpaid' })
const pagination = { page: 1, limit: 10, total: 2, pages: 1 }
const failure = (code) => Object.assign(new Error(code), { code })

let orders

beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    orders = useOrdersStore()
})

describe('orders store', () => {
    it('loads a page of orders', async () => {
        api.list.mockResolvedValueOnce({ items: [summary('a'), summary('b')], pagination })

        await orders.fetchList(1)

        expect(api.list).toHaveBeenCalledWith({ page: 1, limit: 10 })
        expect(orders.list).toHaveLength(2)
        expect(orders.pagination).toEqual(pagination)
        expect(orders.listStatus).toBe('ready')
    })

    it('keeps the error code when the list cannot be loaded', async () => {
        api.list.mockRejectedValueOnce(failure('NETWORK_ERROR'))

        await orders.fetchList(1)

        expect(orders.listStatus).toBe('error')
        expect(orders.listError).toBe('NETWORK_ERROR')
    })

    it('marks a missing order as NOT_FOUND', async () => {
        api.get.mockRejectedValueOnce(failure('NOT_FOUND'))

        await orders.fetchOne('x')

        expect(orders.currentStatus).toBe('error')
        expect(orders.currentError).toBe('NOT_FOUND')
        expect(orders.current).toBeNull()
    })

    it('cancels an order, updates the details and the list, and notifies once', async () => {
        api.list.mockResolvedValueOnce({ items: [summary('a'), summary('b')], pagination })
        api.get.mockResolvedValueOnce(summary('a'))
        api.cancel.mockResolvedValueOnce(summary('a', 'cancelled'))
        await orders.fetchList(1)
        await orders.fetchOne('a')

        await orders.cancel('a')

        expect(orders.current.status).toBe('cancelled')
        expect(orders.list.find((order) => order.id === 'a').status).toBe('cancelled')
        expect(orders.cancelling).toBe(false)
        expect(notify.showSuccess).toHaveBeenCalledTimes(1)
        expect(notify.showSuccess.mock.calls[0][1]).toMatchObject({ messageKey: 'notifications.orderCancelled' })
    })

    it('reports a refused cancellation by its code, never by the server text', async () => {
        api.cancel.mockRejectedValueOnce(failure('INVALID_TRANSITION'))

        expect(await orders.cancel('a')).toBe(false)

        expect(notify.showError).toHaveBeenCalledTimes(1)
        expect(notify.showError).toHaveBeenCalledWith(undefined, { messageKey: 'errors.INVALID_TRANSITION' })
        expect(orders.cancelling).toBe(false)
    })
})
