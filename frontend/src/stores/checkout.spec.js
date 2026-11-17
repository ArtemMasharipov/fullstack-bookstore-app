import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ create: vi.fn() }))
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), clear: vi.fn() }))

vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { clearSession } from '@/services/session'
import { useCartStore } from './cart'
import { useCheckoutStore } from './checkout'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const address = {
    fullName: 'Jan Novák',
    line1: 'Vodičkova 12',
    city: 'Praha',
    postalCode: '110 00',
    country: 'CZ',
    phone: '+420 777 123 456',
}
const order = { id: 'o1', orderNumber: 'ORD-20261015-000001' }
const failure = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra })
const keyOfCall = (n) => api.create.mock.calls[n][1]

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

let checkout
let cart

beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    cart = useCartStore()
    vi.spyOn(cart, 'load').mockResolvedValue()
    checkout = useCheckoutStore()
    checkout.start()
})

describe('checkout store', () => {
    it('starts with a fresh idempotency key', () => {
        const first = checkout.key
        checkout.start()

        expect(first).toMatch(UUID)
        expect(checkout.key).toMatch(UUID)
        expect(checkout.key).not.toBe(first)
        expect(checkout.status).toBe('idle')
    })

    it('makes a version 4 key also where crypto.randomUUID is missing (plain HTTP outside localhost)', () => {
        const realCrypto = crypto
        vi.stubGlobal('crypto', { getRandomValues: (bytes) => realCrypto.getRandomValues(bytes) })
        try {
            checkout.start()
            const first = checkout.key
            checkout.start()

            expect(first).toMatch(UUID)
            expect(checkout.key).toMatch(UUID)
            expect(checkout.key).not.toBe(first)
        } finally {
            vi.unstubAllGlobals()
        }
    })

    it('places the order, reloads the cart, notifies once and takes a new key', async () => {
        const key = checkout.key
        api.create.mockResolvedValueOnce({ order, replayed: false })

        const result = await checkout.submit(address, 29800)

        expect(result).toEqual(order)
        expect(api.create).toHaveBeenCalledWith({ shippingAddress: address, expectedTotal: 29800 }, key)
        expect(cart.load).toHaveBeenCalledTimes(1)
        expect(notify.showSuccess).toHaveBeenCalledTimes(1)
        expect(notify.showSuccess.mock.calls[0][1]).toMatchObject({ messageKey: 'notifications.orderPlaced' })
        expect(checkout.key).toMatch(UUID)
        expect(checkout.key).not.toBe(key)
    })

    it('keeps the key after a lost connection, so a retry repeats the same request', async () => {
        api.create.mockRejectedValueOnce(failure('NETWORK_ERROR')).mockResolvedValueOnce({ order, replayed: true })

        expect(await checkout.submit(address, 29800)).toBeNull()
        expect(checkout.error).toBe('NETWORK_ERROR')
        await checkout.submit(address, 29800)

        expect(keyOfCall(0)).toBe(keyOfCall(1))
        expect(checkout.error).toBeNull()
    })

    it('asks before ordering at a changed total and confirms with the same key', async () => {
        const quote = {
            currency: 'CZK',
            itemsTotal: 20900,
            shipping: 9900,
            vatIncluded: true,
            vatAmount: 0,
            total: 30800,
        }
        api.create.mockRejectedValueOnce(failure('PRICE_CHANGED', { details: { quote } })).mockResolvedValueOnce({
            order,
            replayed: false,
        })

        await checkout.submit(address, 29800)
        expect(checkout.priceChange).toEqual(quote)
        const result = await checkout.confirmPriceChange(address)

        expect(result).toEqual(order)
        expect(api.create.mock.calls[1][0]).toEqual({ shippingAddress: address, expectedTotal: 30800 })
        expect(keyOfCall(0)).toBe(keyOfCall(1))
        expect(checkout.priceChange).toBeNull()
    })

    it('sends one request when submitted twice in a row', async () => {
        let finish
        api.create.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))

        const first = checkout.submit(address, 29800)
        const second = await checkout.submit(address, 29800)
        finish({ order, replayed: false })
        await first

        expect(second).toBeNull()
        expect(api.create).toHaveBeenCalledTimes(1)
    })

    it('keeps the fields the server rejected', async () => {
        const fields = { 'shippingAddress.postalCode': 'invalid_format' }
        api.create.mockRejectedValueOnce(failure('VALIDATION_FAILED', { fields }))

        await checkout.submit(address, 29800)

        expect(checkout.error).toBe('VALIDATION_FAILED')
        expect(checkout.fields).toEqual(fields)
        expect(checkout.status).toBe('idle')
    })

    it('ignores an order answer that arrives after the session ended', async () => {
        const answer = deferred()
        api.create.mockReturnValueOnce(answer.promise)

        const placing = checkout.submit(address, 29800)
        clearSession()
        answer.resolve({ order, replayed: false })

        expect(await placing).toBeNull()
        expect(checkout.key).toBeNull()
        expect(checkout.status).toBe('idle')
        expect(cart.load).not.toHaveBeenCalled()
        expect(notify.showSuccess).not.toHaveBeenCalled()
    })

    it("keeps a new checkout's key when the previous checkout answers late", async () => {
        const previous = deferred()
        const next = deferred()
        api.create.mockReturnValueOnce(previous.promise).mockReturnValueOnce(next.promise)

        const late = checkout.submit(address, 29800)
        checkout.start()
        const key = checkout.key
        const placing = checkout.submit(address, 29800)
        previous.resolve({ order, replayed: false })
        const result = await late

        expect(checkout.key).toBe(key)
        expect(checkout.status).toBe('submitting')
        expect(result).toBeNull()
        expect(cart.load).not.toHaveBeenCalled()
        expect(notify.showSuccess).not.toHaveBeenCalled()

        next.resolve({ order: { ...order, id: 'o2' }, replayed: false })
        expect((await placing).id).toBe('o2')
        expect(keyOfCall(1)).toBe(key)
        expect(cart.load).toHaveBeenCalledTimes(1)
        expect(notify.showSuccess).toHaveBeenCalledTimes(1)
    })

    it('ignores a refusal that belongs to a previous checkout', async () => {
        const previous = deferred()
        api.create.mockReturnValueOnce(previous.promise)

        const late = checkout.submit(address, 29800)
        checkout.start()
        previous.reject(failure('PRICE_CHANGED', { details: { quote: { total: 30800 } } }))

        expect(await late).toBeNull()
        expect(checkout.error).toBeNull()
        expect(checkout.priceChange).toBeNull()
    })

    it('says nothing about the order when the session ends while the cart reloads', async () => {
        const reload = deferred()
        cart.load.mockReturnValueOnce(reload.promise)
        api.create.mockResolvedValueOnce({ order, replayed: false })

        const placing = checkout.submit(address, 29800)
        await vi.waitFor(() => expect(cart.load).toHaveBeenCalledTimes(1))
        clearSession()
        reload.resolve()

        expect(await placing).toBeNull()
        expect(notify.showSuccess).not.toHaveBeenCalled()
    })
})
