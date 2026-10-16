import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const cartApi = vi.hoisted(() => ({ fetch: vi.fn(), quote: vi.fn(), merge: vi.fn() }))
vi.mock('@/services/api/cartApi', () => ({ cartApi }))

import baseApi from '@/services/api/baseApi'
import { useNotifications } from '@/composables/useNotifications'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore, useBooksStore, useCartStore, useCheckoutStore, useOrdersStore } from '@/stores'
import { installSession, resetSession } from './session'

// A token the client can read, valid until 2100
const TOKEN = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.'
const LINE = {
    bookId: 'a'.repeat(24),
    title: 'Babička',
    quantity: 1,
    unitPrice: 19900,
    lineTotal: 19900,
    available: true,
}

let router

function testRouter() {
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}

function signedIn() {
    localStorage.setItem('token', TOKEN)
    localStorage.setItem('userData', JSON.stringify({ name: 'Jana' }))
    localStorage.setItem('redirectPath', '/orders')
    useAuthStore().$patch({ token: TOKEN, user: { name: 'Jana' } })
}

// An adapter that answers every request with this status
const answering = (status) => async (config) => {
    throw { response: { status, data: { success: false, error: { code: 'UNAUTHORIZED' } }, headers: {}, config } }
}

beforeEach(async () => {
    localStorage.clear()
    localStorage.setItem('bookstore-theme', 'dark')
    cartApi.fetch.mockReset()
    cartApi.quote.mockReset()
    cartApi.merge.mockReset()
    setActivePinia(createPinia())
    useNotifications().clear()
    router = testRouter()
    installSession(router)
})

describe('resetSession', () => {
    it('ends the session on a page that needs an account and opens Login in its language with the way back', async () => {
        signedIn()
        localStorage.setItem('cart', JSON.stringify([{ bookId: LINE.bookId, quantity: 1 }]))
        useCartStore().$patch({ lines: [LINE], status: 'ready' })
        useOrdersStore().$patch({ list: [{ id: 'o1' }] })
        useCheckoutStore().$patch({ key: 'checkout-key' })
        useBooksStore().$patch({ books: [{ id: 'b1', title: 'Babička' }] })
        await router.push('/en/orders')

        await resetSession()

        expect(router.currentRoute.value.path).toBe('/en/login')
        expect(router.currentRoute.value.query.redirect).toBe('/en/orders')
        for (const key of ['token', 'userData', 'cart', 'redirectPath'])
            expect(localStorage.getItem(key), key).toBeNull()
        expect(localStorage.getItem('bookstore-theme')).toBe('dark')
        expect(useAuthStore().token).toBeNull()
        expect(useAuthStore().user).toBeNull()
        expect(useCheckoutStore().key).toBeNull()
        expect(useOrdersStore().list).toEqual([])
        expect(useCartStore().lines).toEqual([])
        expect(useBooksStore().books).toEqual([{ id: 'b1', title: 'Babička' }])
    })

    it('keeps a visitor of a public page on that page as a guest', async () => {
        signedIn()
        await router.push('/en/books/abc')

        await resetSession()

        expect(router.currentRoute.value.fullPath).toBe('/en/books/abc')
        expect(localStorage.getItem('token')).toBeNull()
        expect(useAuthStore().token).toBeNull()
    })

    it('clears the notifications of the previous session', async () => {
        signedIn()
        await router.push('/en/books')
        useNotifications().showError(undefined, { messageKey: 'errors.CONFLICT' })

        await resetSession()

        expect(useNotifications().notifications.value).toEqual([])
    })
})

describe('a 401 answer', () => {
    it('ends on one Login page when several requests answer 401 at once', async () => {
        signedIn()
        await router.push('/en/orders')

        const answers = await Promise.allSettled([
            baseApi.get('/orders', { adapter: answering(401) }),
            baseApi.get('/cart', { adapter: answering(401) }),
        ])

        expect(answers.map((answer) => answer.reason.status)).toEqual([401, 401])
        await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/en/login'))
        expect(router.currentRoute.value.query.redirect).toBe('/en/orders')
        expect(localStorage.getItem('token')).toBeNull()
    })

    it('keeps the session and the guest cart when a request without a token answers 401', async () => {
        const guestCart = JSON.stringify([{ bookId: LINE.bookId, quantity: 1 }])
        localStorage.setItem('cart', guestCart)
        await router.push('/en/login')

        const answer = await baseApi.post('/auth/login', {}, { adapter: answering(401) }).catch((error) => error)

        expect(answer.status).toBe(401)
        expect(localStorage.getItem('cart')).toBe(guestCart)
        expect(router.currentRoute.value.fullPath).toBe('/en/login')
    })
})
