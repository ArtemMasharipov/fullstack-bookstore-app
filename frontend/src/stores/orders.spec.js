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
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), clear: vi.fn() }))

vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { clearSession } from '@/services/session'
import { useOrdersStore } from './orders'

const summary = (id, status = 'pending') => ({ id, orderNumber: `ORD-${id}`, status, paymentStatus: 'unpaid' })
const pagination = { page: 1, limit: 10, total: 2, pages: 1 }
const failure = (code) => Object.assign(new Error(code), { code })

// A promise with its resolve and reject at hand
function deferred() {
    let resolve
    let reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

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

    it('ignores a list that answers after the session ended', async () => {
        const answer = deferred()
        api.list.mockReturnValueOnce(answer.promise)

        const loading = orders.fetchList(1)
        clearSession()
        answer.resolve({ items: [summary('a'), summary('b')], pagination })
        await loading

        expect(orders.list).toEqual([])
        expect(orders.pagination).toBeNull()
        expect(orders.listStatus).toBe('idle')
    })

    it('keeps the newest page when an older page answers last', async () => {
        const first = deferred()
        const second = deferred()
        api.list.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

        const older = orders.fetchList(1)
        const newer = orders.fetchList(2)
        second.resolve({ items: [summary('c')], pagination: { ...pagination, page: 2 } })
        await newer
        first.resolve({ items: [summary('a'), summary('b')], pagination })
        await older

        expect(orders.list.map((order) => order.id)).toEqual(['c'])
        expect(orders.pagination.page).toBe(2)
        expect(orders.listStatus).toBe('ready')
    })

    it('ignores a failure of an older page while the newest is on its way', async () => {
        const first = deferred()
        api.list.mockReturnValueOnce(first.promise).mockReturnValueOnce(new Promise(() => {}))

        const older = orders.fetchList(1)
        orders.fetchList(2)
        first.reject(failure('NETWORK_ERROR'))
        await older

        expect(orders.listStatus).toBe('loading')
        expect(orders.listError).toBeNull()
    })

    it('ignores an order that answers after the session ended', async () => {
        const answer = deferred()
        api.get.mockReturnValueOnce(answer.promise)

        const loading = orders.fetchOne('a')
        clearSession()
        answer.resolve(summary('a'))
        await loading

        expect(orders.current).toBeNull()
        expect(orders.currentStatus).toBe('idle')
    })

    it('keeps the newest order when an older one answers last', async () => {
        const first = deferred()
        const second = deferred()
        api.get.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)

        const older = orders.fetchOne('a')
        const newer = orders.fetchOne('b')
        second.resolve(summary('b'))
        await newer
        first.reject(failure('NOT_FOUND'))
        await older

        expect(orders.current.id).toBe('b')
        expect(orders.currentStatus).toBe('ready')
        expect(orders.currentError).toBeNull()
    })

    it.each([
        ['succeeds', (answer) => answer.resolve(summary('a', 'cancelled'))],
        ['fails', (answer) => answer.reject(failure('INVALID_TRANSITION'))],
    ])('says nothing about a cancellation that %s after the session ended', async (_outcome, settle) => {
        const answer = deferred()
        api.cancel.mockReturnValueOnce(answer.promise).mockReturnValueOnce(new Promise(() => {}))

        const cancelling = orders.cancel('a')
        clearSession()
        // The next session cancels an order of its own while the old answer is still on its way
        orders.cancel('b')
        settle(answer)

        expect(await cancelling).toBe(false)
        expect(notify.showSuccess).not.toHaveBeenCalled()
        expect(notify.showError).not.toHaveBeenCalled()
        expect(api.cancel).toHaveBeenCalledTimes(2)
        expect(orders.cancelling).toBe(true)
    })
})
