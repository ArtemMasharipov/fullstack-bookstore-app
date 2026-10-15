import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'

const api = vi.hoisted(() => ({ get: vi.fn(), cancel: vi.fn() }))
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { formatMoney } from '@/utils/money'
import OrderDetailsView from './OrderDetailsView.vue'

const order = (overrides = {}) => ({
    id: 'o1',
    orderNumber: 'ORD-20261015-000001',
    status: 'pending',
    paymentStatus: 'unpaid',
    items: [{ bookId: 'b1', title: 'Babička', unitPrice: 19900, quantity: 2, lineTotal: 39800 }],
    shippingAddress: {
        fullName: 'Jan Novák',
        line1: 'Vodičkova 12',
        city: 'Praha',
        postalCode: '110 00',
        country: 'CZ',
        phone: '+420 777 123 456',
    },
    quote: { currency: 'CZK', itemsTotal: 39800, shipping: 9900, vatIncluded: true, vatAmount: 0, total: 49700 },
    statusHistory: [
        { axis: 'status', from: null, to: 'pending', by: 'user', at: '2026-10-15T10:00:00.000Z' },
        { axis: 'payment', from: 'unpaid', to: 'failed', by: 'admin', at: '2026-10-15T11:00:00.000Z' },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
    ...overrides,
})
const failure = (code) => Object.assign(new Error(code), { code })
const button = (label) => [...document.querySelectorAll('button')].find((b) => b.textContent.includes(label))

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

async function mount() {
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    await router.push('/orders/o1')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(OrderDetailsView) }) })
        .use(i18n)
        .use(createVuetify({ components }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

describe('OrderDetailsView', () => {
    it('shows the books, the address, the total, both statuses and the history in order', async () => {
        api.get.mockResolvedValueOnce(order())

        await mount()

        await vi.waitFor(() => expect(document.body.textContent).toContain('ORD-20261015-000001'))
        const text = document.body.textContent
        expect(text).toContain('Babička')
        expect(text).toContain(formatMoney(39800))
        expect(text).toContain('Vodičkova 12')
        expect(text).toContain('110 00 Praha')
        expect(text).toContain(formatMoney(49700))
        expect(text).toContain(t('orders.status.pending'))
        expect(text).toContain(t('orders.payment.unpaid'))
        const history = [...document.querySelectorAll('.order-history li')].map((li) => li.textContent)
        expect(history).toHaveLength(2)
        expect(history[0]).toContain(t('orders.status.pending'))
        expect(history[1]).toContain(t('orders.payment.failed'))
        expect(history[1]).toContain(t('orders.historyBy.admin'))
        expect(api.get).toHaveBeenCalledWith('o1')
    })

    it.each([
        ['a pending unpaid order', {}, true],
        ['a pending order whose payment failed', { paymentStatus: 'failed' }, true],
        ['a paid order', { paymentStatus: 'paid' }, false],
        ['a shipped order', { status: 'shipped' }, false],
    ])('offers cancellation for %s: %s', async (_, overrides, offered) => {
        api.get.mockResolvedValueOnce(order(overrides))

        await mount()
        await vi.waitFor(() => expect(document.body.textContent).toContain('ORD-20261015-000001'))

        expect(Boolean(button(t('orders.cancel')))).toBe(offered)
    })

    it('cancels after a confirmation and then shows the cancelled status without the button', async () => {
        api.get.mockResolvedValueOnce(order())
        api.cancel.mockResolvedValueOnce(order({ status: 'cancelled' }))
        await mount()
        await vi.waitFor(() => expect(button(t('orders.cancel'))).toBeDefined())

        button(t('orders.cancel')).click()
        await vi.waitFor(() => expect(button(t('orders.cancelConfirm'))).toBeDefined())
        expect(api.cancel).not.toHaveBeenCalled()
        button(t('orders.cancelConfirm')).click()

        await vi.waitFor(() => expect(api.cancel).toHaveBeenCalledWith('o1'))
        await vi.waitFor(() => expect(document.body.textContent).toContain(t('orders.status.cancelled')))
        expect(button(t('orders.cancel'))).toBeUndefined()
    })

    it('says an order that is not found was not found and shows nothing else', async () => {
        api.get.mockRejectedValueOnce(failure('NOT_FOUND'))

        await mount()

        await vi.waitFor(() => expect(document.body.textContent).toContain(t('orders.notFound')))
        expect(document.querySelector('a[href="/orders"]')).not.toBeNull()
        expect(document.querySelector('.order-history')).toBeNull()
        expect(button(t('orders.cancel'))).toBeUndefined()
    })

    it('offers a retry after a lost connection', async () => {
        api.get.mockRejectedValueOnce(failure('NETWORK_ERROR')).mockResolvedValueOnce(order())

        await mount()
        await vi.waitFor(() => expect(button(t('errors.retry'))).toBeDefined())
        button(t('errors.retry')).click()

        await vi.waitFor(() => expect(document.body.textContent).toContain('ORD-20261015-000001'))
        expect(api.get).toHaveBeenCalledTimes(2)
    })
})
