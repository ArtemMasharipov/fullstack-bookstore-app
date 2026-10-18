import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const books = vi.hoisted(() => ({ fetchById: vi.fn() }))
const config = vi.hoisted(() => ({ fetchPublic: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))
vi.mock('@/services/api/configApi', () => ({ configApi: config }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { formatMoney } from '@/utils/money'
import BookDetails from './BookDetails.vue'

const BOOK = {
    id: 'b1',
    title: 'Babička',
    price: 299,
    inStock: true,
    author: { name: 'Božena Němcová' },
    description: 'A novel.',
}

let app

function testRouter() {
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    books.fetchById.mockReset()
    config.fetchPublic.mockReset()
    books.fetchById.mockResolvedValue({ success: true, data: BOOK })
    config.fetchPublic.mockResolvedValue({
        currency: 'CZK',
        vatIncluded: true,
        vatRatePercent: 0,
        shippingFee: 9900,
        freeShippingThreshold: 100000,
        paymentMethods: [],
    })
    setActivePinia(createPinia())
    await loadLocale('cs')
    activateLocale('cs')
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount() {
    const router = testRouter()
    await router.push('/books/b1')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(BookDetails, { bookId: 'b1' }) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    return root
}

describe('BookDetails', () => {
    it('names the free-shipping threshold of the shop settings and no return policy', async () => {
        await mount()

        await vi.waitFor(() => expect(document.body.textContent).toContain(`Doprava zdarma od ${formatMoney(100000)}`))
        expect(document.body.textContent).not.toMatch(/return/i)
    })

    it('speaks Czech', async () => {
        const root = await mount()

        await vi.waitFor(() => expect(root.textContent).toContain('Přidat do košíku'))
        expect(root.textContent).toContain('Skladem')
        expect(root.querySelector('.v-breadcrumbs a').textContent.trim()).toBe('Knihy')
        expect(root.textContent).not.toMatch(/Add to Cart|In Stock/)
        expect(root.querySelector('[aria-label="Zvýšit množství"]')).not.toBeNull()
    })

    it('shows the cover placeholder for a book without an image', async () => {
        const root = await mount()

        await vi.waitFor(() => expect(root.querySelector('.book-cover__placeholder')?.textContent).toContain('Babička'))
    })

    it('marks the price with the price colour', async () => {
        const root = await mount()

        await vi.waitFor(() => expect(root.querySelector('.book-details__price.text-price')).not.toBeNull())
    })

    it('explains a missing book by its error code and offers Try again', async () => {
        books.fetchById.mockRejectedValueOnce({ code: 'NOT_FOUND' })
        const root = await mount()

        const alert = await vi.waitFor(() => {
            const found = [...root.querySelectorAll('[role="alert"]')].find((el) =>
                el.textContent.includes(cs.errors.NOT_FOUND)
            )
            expect(found).toBeDefined()
            return found
        })
        ;[...alert.querySelectorAll('button')].find((b) => b.textContent.trim() === cs.errors.retry).click()

        await vi.waitFor(() => expect(books.fetchById).toHaveBeenCalledTimes(2))
        await vi.waitFor(() => expect(root.querySelector('h1').textContent).toContain('Babička'))
    })

    it('leaves out the author and the year when the book has none', async () => {
        books.fetchById.mockResolvedValue({ success: true, data: { ...BOOK, author: null } })
        const root = await mount()

        await vi.waitFor(() => expect(root.querySelector('h1').textContent).toContain('Babička'))
        expect(root.textContent).not.toMatch(/Unknown Author|N\/A/)
    })

    it('says a book out of stock is not available and offers no button', async () => {
        books.fetchById.mockResolvedValue({ success: true, data: { ...BOOK, inStock: false } })
        const root = await mount()

        await vi.waitFor(() => expect(root.textContent).toContain(cs.book.outOfStock))
        expect(root.textContent).not.toContain('Přidat do košíku')
    })
})
