import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import BookDetails from '@/components/features/books/BookDetails.vue'
import AuthorDetails from '@/components/features/authors/AuthorDetails.vue'
import OrderDetailsView from '@/views/orders/OrderDetailsView.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { booksApi } from '@/services/api/booksApi'
import { authorsApi } from '@/services/api/authorsApi'
import { orderApi } from '@/services/api/orderApi'
import { i18n } from '@/i18n'
import csMessages from '@/i18n/locales/cs.json'
import enMessages from '@/i18n/locales/en.json'
import { buildRoutes } from './buildRoutes'
import { installLocaleRouting } from './locale'

let app
beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        async (url) =>
            new Response(
                JSON.stringify(
                    String(url).includes('/en-') || String(url).endsWith('/en.json') ? enMessages : csMessages
                )
            )
    )
    vi.spyOn(booksApi, 'fetchById').mockResolvedValue({
        success: true,
        data: {
            _id: 'fixture-book',
            title: 'Fixture book',
            price: 299.9,
            inStock: true,
            author: null,
            relatedBooks: [],
        },
    })
    vi.spyOn(authorsApi, 'fetchById').mockResolvedValue({ _id: 'fixture-author', name: 'Fixture Author', books: [] })
    vi.spyOn(orderApi, 'get').mockResolvedValue({
        id: 'fixture-order',
        orderNumber: 'ORD-20261015-000001',
        status: 'pending',
        paymentStatus: 'unpaid',
        items: [],
        shippingAddress: {
            fullName: 'Jan Novák',
            line1: 'Vodičkova 12',
            city: 'Praha',
            postalCode: '110 00',
            country: 'CZ',
            phone: '+420 777 123 456',
        },
        quote: { currency: 'CZK', itemsTotal: 29990, shipping: 0, vatIncluded: true, vatAmount: 0, total: 29990 },
        statusHistory: [],
        createdAt: '2026-10-15T10:00:00.000Z',
    })
})
afterEach(() => {
    app?.unmount()
    app = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    localStorage.clear()
    document.body.replaceChildren()
})

describe('real detail breadcrumb navigation', () => {
    it.each([
        ['Books', '/books', BookDetails, { bookId: 'fixture-book' }],
        ['Authors', '/authors', AuthorDetails, { authorId: 'fixture-author' }],
        ['Orders', '/orders', OrderDetailsView, {}],
    ])('%s retains EN and reacts to a same-detail switch to CS', async (title, path, component, props) => {
        const pinia = createPinia()
        setActivePinia(pinia)
        const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
        installLocaleRouting(router)
        await router.push(`/en${path}/fixture-id`)
        const root = document.createElement('div')
        document.body.append(root)
        app = createApp({
            render: () => h(components.VApp, {}, { default: () => [h(LanguageSwitcher), h(component, props)] }),
        })
            .use(pinia)
            .use(i18n)
            .use(router)
            .use(createVuetify({ components }))
        app.mount(root)
        await vi.waitFor(() => expect(root.querySelector('.v-breadcrumbs a')?.textContent).toContain(title))
        const breadcrumb = () => root.querySelector('.v-breadcrumbs a')
        expect(breadcrumb().getAttribute('href')).toBe(`/en${path}`)
        breadcrumb().click()
        await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`/en${path}`))
        expect(document.documentElement.lang).toBe('en')
        await router.push(`/en${path}/fixture-id`)
        root.querySelector('button[lang="cs"]').click()
        await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(`${path}/fixture-id`))
        await nextTick()
        expect(breadcrumb().getAttribute('href')).toBe(path)
        breadcrumb().click()
        await vi.waitFor(() => expect(router.currentRoute.value.path).toBe(path))
        expect(document.documentElement.lang).toBe('cs')
    })
})
