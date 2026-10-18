import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const books = vi.hoisted(() => ({ fetchAll: vi.fn() }))
const config = vi.hoisted(() => ({ fetchPublic: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))
vi.mock('@/services/api/configApi', () => ({ configApi: config }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { formatMoney } from '@/utils/money'
import HomeView from './HomeView.vue'

const SETTINGS = {
    currency: 'CZK',
    vatIncluded: true,
    vatRatePercent: 0,
    shippingFee: 9900,
    freeShippingThreshold: 100000,
    paymentMethods: [],
}
const BOOK = { id: 'b1', title: 'Babička', price: 299, inStock: true, author: { name: 'Božena Němcová' } }

let app
let router

function testRouter() {
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}

beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    books.fetchAll.mockReset()
    config.fetchPublic.mockReset()
    books.fetchAll.mockResolvedValue({ success: true, data: [BOOK] })
    config.fetchPublic.mockResolvedValue(SETTINGS)
    setActivePinia(createPinia())
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    router = testRouter()
    await router.push(locale === 'en' ? '/en' : '/')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(HomeView) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await vi.waitFor(() => expect(document.querySelector('.book-card')).not.toBeNull())
}

const hrefOf = (label) =>
    router.resolve([...document.querySelectorAll('a')].find((a) => a.textContent.includes(label)).getAttribute('href'))
        .fullPath

describe('HomeView', () => {
    it('states delivery from the shop settings', async () => {
        await mount()

        await vi.waitFor(() => expect(document.querySelector('.home-terms')).not.toBeNull())
        const terms = document.querySelector('.home-terms').textContent
        expect(terms).toContain(
            `Doprava stojí ${formatMoney(9900)}, objednávky od ${formatMoney(100000)} doručíme zdarma.`
        )
        expect(terms).toContain('Ceny včetně DPH')
    })

    it('says nothing about VAT when the prices do not include it', async () => {
        config.fetchPublic.mockResolvedValue({ ...SETTINGS, vatIncluded: false })
        await mount()

        await vi.waitFor(() => expect(document.querySelector('.home-terms')).not.toBeNull())
        expect(document.querySelector('.home-terms').textContent).not.toContain('DPH')
    })

    it('shows no terms when the settings cannot be loaded', async () => {
        config.fetchPublic.mockRejectedValue(new Error('Network Error'))
        await mount()
        await nextTick()

        expect(document.querySelector('.home-terms')).toBeNull()
    })

    it('keeps the English prefix in its links', async () => {
        await mount('en')

        expect(hrefOf('Browse books')).toBe('/en/books')
        expect(hrefOf('View all')).toBe('/en/books')
        expect(hrefOf('Fiction')).toBe('/en/books?category=Fiction')
        expect(document.querySelector('.book-card__link').getAttribute('href')).toBe('/en/books/b1')
    })

    it('speaks Czech', async () => {
        await mount()

        expect(document.querySelector('h1').textContent).toContain('Objevte svou další skvělou knihu')
    })
})
