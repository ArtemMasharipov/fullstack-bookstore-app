import { beforeEach, describe, expect, it, vi } from 'vitest'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock('./baseApi', () => ({ default: http }))

import { orderApi } from './orderApi'

const order = { id: 'o1', orderNumber: 'ORD-20261015-000001' }
const pagination = { page: 1, limit: 10, total: 1, pages: 1 }
const answer = (status, data, extra = {}) => ({ status, data: { success: true, data, ...extra } })

beforeEach(() => vi.clearAllMocks())

describe('orderApi', () => {
    it('records a payment or refund through the payment endpoint', async () => {
        http.patch.mockResolvedValue(answer(200, order))
        for (const payment of ['paid', 'refunded']) {
            expect(await orderApi.adminSetPayment('o1', payment)).toEqual(order)
            expect(http.patch).toHaveBeenCalledWith('/orders/o1/payment', { paymentStatus: payment })
        }
    })
    it('places an order with the idempotency key and tells a new order from a repeated one', async () => {
        const body = { shippingAddress: { fullName: 'Jan Novák' }, expectedTotal: 29800 }
        http.post.mockResolvedValueOnce(answer(201, order)).mockResolvedValueOnce(answer(200, order))

        const created = await orderApi.create(body, 'key-1')
        const repeated = await orderApi.create(body, 'key-1')

        expect(http.post).toHaveBeenCalledWith('/orders', body, { headers: { 'Idempotency-Key': 'key-1' } })
        expect(created).toEqual({ order, replayed: false })
        expect(repeated).toEqual({ order, replayed: true })
    })

    it('lists a page of orders with its pagination', async () => {
        http.get.mockResolvedValueOnce(answer(200, [order], { pagination }))

        const result = await orderApi.list({ page: 2, limit: 10 })

        expect(http.get).toHaveBeenCalledWith('/orders', { params: { page: 2, limit: 10 } })
        expect(result).toEqual({ items: [order], pagination })
    })

    it('reads, cancels and administers single orders', async () => {
        http.get.mockResolvedValue(answer(200, order))
        http.patch.mockResolvedValue(answer(200, order))

        expect(await orderApi.get('o1')).toEqual(order)
        expect(await orderApi.cancel('o1')).toEqual(order)
        expect(await orderApi.adminSetStatus('o1', 'shipped')).toEqual(order)

        expect(http.get).toHaveBeenCalledWith('/orders/o1')
        expect(http.patch).toHaveBeenCalledWith('/orders/o1/cancel')
        expect(http.patch).toHaveBeenCalledWith('/orders/o1/status', { status: 'shipped' })
    })

    it('lists all orders and their statistics for the admin', async () => {
        const stats = { total: 1, totalRevenue: 29800, currency: 'CZK' }
        http.get.mockResolvedValueOnce(answer(200, [order], { pagination })).mockResolvedValueOnce(answer(200, stats))

        expect(await orderApi.adminList({ limit: 5 })).toEqual({ items: [order], pagination })
        expect(await orderApi.adminStats()).toEqual(stats)
        expect(http.get).toHaveBeenNthCalledWith(1, '/orders/admin/all', { params: { limit: 5 } })
        expect(http.get).toHaveBeenNthCalledWith(2, '/orders/admin/stats')
    })
})
