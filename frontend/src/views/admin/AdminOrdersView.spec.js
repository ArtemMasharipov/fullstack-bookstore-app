import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const api = vi.hoisted(() => ({ adminList: vi.fn(), adminSetStatus: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { formatMoney } from '@/utils/money'
import AdminOrdersView from './AdminOrdersView.vue'

const customer = { id: 'u1', email: 'jan@example.com', username: 'jan' }
const current = {
    id: 'o1',
    orderNumber: 'ORD-20261015-000001',
    status: 'pending',
    paymentStatus: 'unpaid',
    items: [{ bookId: 'b1', title: 'Babička', unitPrice: 34900, quantity: 1, lineTotal: 34900 }],
    shippingAddress: {
        fullName: 'Jan Novák',
        line1: 'Vodičkova 12',
        city: 'Praha',
        postalCode: '110 00',
        country: 'CZ',
        phone: '+420 777 123 456',
    },
    quote: { currency: 'CZK', itemsTotal: 34900, shipping: 0, vatIncluded: true, vatAmount: 0, total: 34900 },
    statusHistory: [],
    createdAt: '2026-10-15T10:00:00.000Z',
    customer,
}
// An order of the previous shape as the API shows it after the adapter
const older = {
    ...current,
    id: 'o2',
    orderNumber: 'ORD-20250101-0001',
    paymentStatus: 'paid',
    quote: { currency: 'CZK', itemsTotal: 2598, shipping: 1000, vatIncluded: false, vatAmount: 260, total: 3858 },
    customer: null,
}

let app

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
    vi.clearAllMocks()
    setActivePinia(createPinia())
    api.adminList.mockResolvedValue({
        items: [current, older],
        pagination: { page: 1, limit: 10, total: 2, pages: 1 },
    })
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount() {
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(AdminOrdersView) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await nextTick()
}

const rows = () => [...document.querySelectorAll('tbody tr')]

describe('AdminOrdersView', () => {
    it('lists orders of both shapes with their number, customer and total', async () => {
        await mount()

        await vi.waitFor(() => expect(rows()).toHaveLength(2))
        expect(rows()[0].textContent).toContain('ORD-20261015-000001')
        expect(rows()[0].textContent).toContain('jan@example.com')
        expect(rows()[0].textContent).toContain(formatMoney(34900))
        expect(rows()[1].textContent).toContain('ORD-20250101-0001')
        expect(rows()[1].textContent).toContain(formatMoney(3858))
        expect(api.adminList).toHaveBeenCalledWith({ page: 1, limit: 10 })
    })

    it('changes the status of an order through the admin API', async () => {
        api.adminSetStatus.mockResolvedValueOnce({ ...current, status: 'shipped' })
        await mount()
        await vi.waitFor(() => expect(rows()).toHaveLength(2))

        rows()[0].querySelector('.edit-status').click()
        await vi.waitFor(() => expect(document.querySelector('input[type="radio"][value="shipped"]')).not.toBeNull())
        document.querySelector('input[type="radio"][value="shipped"]').click()
        await nextTick()
        ;[...document.querySelectorAll('button')].find((button) => button.textContent.trim() === 'Save').click()

        await vi.waitFor(() => expect(api.adminSetStatus).toHaveBeenCalledWith('o1', 'shipped'))
    })
})
