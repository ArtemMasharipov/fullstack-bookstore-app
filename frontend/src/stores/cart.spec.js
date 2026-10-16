import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
    fetch: vi.fn(),
    add: vi.fn(),
    setQuantity: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    quote: vi.fn(),
    merge: vi.fn(),
}))
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() }))

vi.mock('@/services/api/cartApi', () => ({ cartApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { readGuestItems, useCartStore } from './cart'

const A = 'a'.repeat(24)
const B = 'b'.repeat(24)
const C = 'c'.repeat(24)

const line = (bookId, quantity, title = `Book ${bookId[0]}`) => ({
    bookId,
    title,
    authorName: null,
    image: null,
    unitPrice: 10000,
    quantity,
    lineTotal: 10000 * quantity,
    available: true,
    unavailableReason: null,
})
const view = (...items) => ({ items, quote: { currency: 'CZK', total: items.length * 100 } })
const guestCart = () => JSON.parse(localStorage.getItem('cart'))

let cart

beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    setActivePinia(createPinia())
    cart = useCartStore()
})

describe('guest cart', () => {
    it('loads an empty guest cart without asking the server', async () => {
        await cart.load()

        expect(api.quote).not.toHaveBeenCalled()
        expect(cart.status).toBe('ready')
        expect(cart.lines).toEqual([])
    })

    it('keeps only ids and quantities locally and shows the server quote', async () => {
        api.quote.mockResolvedValueOnce(view(line(A, 1))).mockResolvedValueOnce(view(line(A, 2)))

        await cart.add(A)
        await cart.add(A)

        expect(guestCart()).toEqual([{ bookId: A, quantity: 2 }])
        expect(api.quote).toHaveBeenLastCalledWith([{ bookId: A, quantity: 2 }])
        expect(cart.lines).toEqual([line(A, 2)])
        expect(cart.quote).toEqual(view(line(A, 2)).quote)
    })

    it('refuses to go past 99 copies like the server does', async () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: A, quantity: 99 }]))

        const added = await cart.add(A)

        expect(added).toBe(false)
        expect(api.quote).not.toHaveBeenCalled()
        expect(notify.showError).toHaveBeenCalledWith(undefined, { messageKey: 'errors.VALIDATION_FAILED' })
        expect(guestCart()).toEqual([{ bookId: A, quantity: 99 }])
    })
})

describe('a guest adding a book the server cannot sell', () => {
    it('a guest cannot add a book the server reports unavailable', async () => {
        api.quote.mockReset()
        api.quote.mockResolvedValueOnce(
            view({ ...line(A, 1), available: false, unavailableReason: 'OUT_OF_STOCK', unitPrice: 0, lineTotal: 0 })
        )

        await expect(cart.add(A)).resolves.toBe(false)

        expect(localStorage.getItem('cart')).toBeNull()
        expect(notify.showError).toHaveBeenCalledWith(undefined, { messageKey: 'errors.BOOK_UNAVAILABLE' })
        expect(notify.showSuccess).not.toHaveBeenCalled()
    })
})

describe('changes that overlap', () => {
    // The answer of quote(items), resolved when the test says so
    const deferredQuotes = () => {
        const calls = []
        api.quote.mockImplementation(
            (items) =>
                new Promise((resolve) => {
                    calls.push(() => resolve(view(...items.map((item) => line(item.bookId, item.quantity)))))
                })
        )
        return calls
    }
    const flush = () => new Promise((resolve) => setTimeout(resolve))

    it('keeps both of two guest additions started together', async () => {
        api.quote.mockImplementation(async (items) => view(...items.map((item) => line(item.bookId, item.quantity))))

        await Promise.all([cart.add(A), cart.add(B)])

        expect(guestCart()).toEqual([
            { bookId: A, quantity: 1 },
            { bookId: B, quantity: 1 },
        ])
        expect(cart.lines.map((l) => l.bookId)).toEqual([A, B])
    })

    it('does not let a refresh started during a change undo it', async () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: B, quantity: 1 }]))
        const answers = deferredQuotes()

        const adding = cart.add(A)
        const refreshing = cart.load()
        await flush()
        answers.shift()()
        await flush()
        answers.shift()?.()
        await Promise.all([adding, refreshing])

        expect(guestCart()).toEqual([
            { bookId: B, quantity: 1 },
            { bookId: A, quantity: 1 },
        ])
        expect(cart.lines.map((l) => l.bookId)).toEqual([B, A])
    })

    it('marks a line pending for exactly as long as its change runs, failure included', async () => {
        localStorage.setItem('token', 'token')
        let fail
        api.setQuantity.mockReturnValue(new Promise((resolve, reject) => (fail = reject)))

        const changing = cart.setQuantity(A, 2)
        expect(cart.pending).toEqual([A])
        fail(new Error('Network'))
        await changing

        expect(cart.pending).toEqual([])
    })
})

describe('readGuestItems', () => {
    it('keeps valid entries of the old or a broken shape and drops the rest', () => {
        localStorage.setItem(
            'cart',
            JSON.stringify([
                { bookId: A, quantity: 1, price: 9, title: 'x' },
                { bookId: 'bad', quantity: 1 },
                { bookId: B, quantity: '2' },
                { bookId: C, quantity: 150 },
            ])
        )

        expect(readGuestItems()).toEqual([{ bookId: A, quantity: 1 }])
    })

    it('lower-cases ids the way the server prints them', () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: A.toUpperCase(), quantity: 1 }]))

        expect(readGuestItems()).toEqual([{ bookId: A, quantity: 1 }])
    })

    it.each(['{', '{}', 'null'])('reads %j as an empty cart', (stored) => {
        localStorage.setItem('cart', stored)

        expect(readGuestItems()).toEqual([])
    })
})

describe('signed-in cart', () => {
    beforeEach(() => localStorage.setItem('token', 'token'))

    it('adds on the server, stores nothing locally and notifies once with the server title', async () => {
        api.add.mockResolvedValue(view(line(A, 1, 'Babička')))

        const added = await cart.add(A)

        expect(added).toBe(true)
        expect(api.add).toHaveBeenCalledWith(A, 1)
        expect(localStorage.getItem('cart')).toBeNull()
        expect(notify.showSuccess).toHaveBeenCalledTimes(1)
        expect(notify.showSuccess.mock.calls[0][1]).toMatchObject({
            messageKey: 'notifications.cartAdded',
            messageParams: { title: 'Babička' },
        })
    })

    it('reports a failed load by its dictionary key', async () => {
        const networkError = Object.assign(new Error('Network'), { code: 'NETWORK_ERROR' })
        api.fetch.mockRejectedValue(networkError)

        await cart.load()

        expect(cart.status).toBe('error')
        expect(cart.error).toBe('errors.UNKNOWN')
    })

    it('refreshes a loaded cart without going back to loading', async () => {
        api.fetch.mockResolvedValueOnce(view(line(A, 1)))
        await cart.load()
        let answer
        api.fetch.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))

        const refreshing = cart.load()

        expect(cart.status).toBe('ready')
        expect(cart.lines).toEqual([line(A, 1)])
        answer(view(line(A, 2)))
        await refreshing
        expect(cart.lines).toEqual([line(A, 2)])
    })

    it('counts every copy of every line', async () => {
        api.fetch.mockResolvedValue(view(line(A, 2), line(B, 3)))

        await cart.load()

        expect(cart.totalQuantity).toBe(5)
    })
})

describe('mergeGuestCart', () => {
    beforeEach(() => localStorage.setItem('token', 'token'))

    it('sends the guest cart, then forgets it and shows the merged cart', async () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: A, quantity: 1 }]))
        const report = { added: [A], merged: [], skipped: [] }
        api.merge.mockResolvedValue({ cart: view(line(A, 1)), report })

        const result = await cart.mergeGuestCart()

        expect(api.merge).toHaveBeenCalledWith([{ bookId: A, quantity: 1 }])
        expect(localStorage.getItem('cart')).toBeNull()
        expect(cart.lines).toEqual([line(A, 1)])
        expect(result).toEqual(report)
    })

    it('keeps the guest cart when the merge fails, without throwing', async () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: A, quantity: 1 }]))
        api.merge.mockRejectedValue(new Error('Network'))

        await expect(cart.mergeGuestCart()).resolves.toBeNull()

        expect(guestCart()).toEqual([{ bookId: A, quantity: 1 }])
    })

    it('warns once about the books it could not add', async () => {
        localStorage.setItem('cart', JSON.stringify([{ bookId: A, quantity: 1 }]))
        const skipped = [
            { bookId: B, reason: 'DELETED' },
            { bookId: C, reason: 'OUT_OF_STOCK' },
        ]
        api.merge.mockResolvedValue({ cart: view(line(A, 1)), report: { added: [A], merged: [], skipped } })

        await cart.mergeGuestCart()

        expect(notify.showWarning).toHaveBeenCalledTimes(1)
        expect(notify.showWarning.mock.calls[0][1]).toMatchObject({
            messageKey: 'cart.mergeSkipped',
            messageParams: { count: 2 },
        })
    })

    it('does nothing without a guest cart', async () => {
        await expect(cart.mergeGuestCart()).resolves.toBeNull()

        expect(api.merge).not.toHaveBeenCalled()
    })
})

describe('forget', () => {
    it('an answer that arrives after sign-out does not bring the old cart back', async () => {
        api.fetch.mockReset()
        let answer
        api.fetch.mockReturnValueOnce(new Promise((resolve) => (answer = resolve)))
        localStorage.setItem('token', 'local-demo-token')
        const loading = cart.load()
        await vi.waitFor(() => expect(api.fetch).toHaveBeenCalled())

        localStorage.removeItem('token')
        const forgotten = cart.forget()
        answer(view(line(A, 2)))
        await loading
        await forgotten

        expect(cart.lines).toEqual([])
        expect(cart.status).toBe('ready')
        expect(cart.totalQuantity).toBe(0)
    })
})
