import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

const api = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))

import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { formatDate } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import OrdersView from './OrdersView.vue'

const summary = (id, overrides = {}) => ({
    id,
    orderNumber: `ORD-20261015-00000${id}`,
    createdAt: '2026-10-15T10:00:00.000Z',
    status: 'pending',
    paymentStatus: 'unpaid',
    total: 29800,
    currency: 'CZK',
    itemCount: 3,
    ...overrides,
})
const page = (items, pageNumber = 1, pages = 1) => ({
    items,
    pagination: { page: pageNumber, limit: 10, total: items.length, pages },
})
const failure = (code) => Object.assign(new Error(code), { code })

let app
let router

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
    vi.clearAllMocks()
    setActivePinia(createPinia())
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(path = '/orders') {
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    await router.push(path)
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(OrdersView) }) })
        .use(i18n)
        .use(createVuetify({ components }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

describe('OrdersView', () => {
    it('shows skeletons while the orders load', async () => {
        api.list.mockReturnValueOnce(new Promise(() => {}))

        await mount()

        expect(document.querySelector('.v-skeleton-loader')).not.toBeNull()
    })

    it('lists each order with its number, date, statuses, total, books and a link', async () => {
        api.list.mockResolvedValueOnce(page([summary('1', { paymentStatus: 'paid', status: 'processing' })]))

        await mount()

        await vi.waitFor(() => expect(document.querySelector('.order-row')).not.toBeNull())
        const row = document.querySelector('.order-row')
        expect(row.textContent).toContain('ORD-20261015-000001')
        expect(row.textContent).toContain(formatDate('2026-10-15T10:00:00.000Z'))
        expect(row.textContent).toContain(t('orders.status.processing'))
        expect(row.textContent).toContain(t('orders.payment.paid'))
        expect(row.textContent).toContain(formatMoney(29800))
        expect(row.textContent).toContain(t('orders.bookCount', { count: 3 }))
        expect(row.querySelector('a[href="/orders/1"]')).not.toBeNull()
    })

    it('loads the page from the URL and moves to another page through the URL', async () => {
        api.list.mockResolvedValueOnce(page([summary('1')], 2, 3)).mockResolvedValueOnce(page([summary('2')], 3, 3))

        await mount('/orders?page=2')
        await vi.waitFor(() => expect(document.querySelector('.order-row')).not.toBeNull())
        const next = document.querySelector('.v-pagination__next button')
        next.click()

        await vi.waitFor(() => expect(router.currentRoute.value.query.page).toBe('3'))
        await vi.waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ page: 3, limit: 10 }))
        expect(api.list.mock.calls[0][0]).toEqual({ page: 2, limit: 10 })
    })

    it('says there are no orders yet and links to the catalogue', async () => {
        api.list.mockResolvedValueOnce(page([]))

        await mount()

        await vi.waitFor(() => expect(document.body.textContent).toContain(t('orders.empty')))
        expect(document.querySelector('a[href="/books"]')).not.toBeNull()
    })

    it('shows an error with a retry that loads the orders again', async () => {
        api.list.mockRejectedValueOnce(failure('NETWORK_ERROR')).mockResolvedValueOnce(page([summary('1')]))

        await mount()
        await vi.waitFor(() => expect(document.body.textContent).toContain(t('errors.retry')))
        ;[...document.querySelectorAll('button')]
            .find((button) => button.textContent.includes(t('errors.retry')))
            .click()

        await vi.waitFor(() => expect(document.querySelector('.order-row')).not.toBeNull())
        expect(api.list).toHaveBeenCalledTimes(2)
    })
})
