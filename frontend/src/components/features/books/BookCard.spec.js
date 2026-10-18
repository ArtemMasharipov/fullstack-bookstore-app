import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { activateLocale, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore, useCartStore } from '@/stores'
import BookCard from './BookCard.vue'

const BOOK = {
    id: 'b1',
    title: 'Babička',
    author: { id: 'a1', name: 'Božena Němcová' },
    category: 'Fiction',
    publicationYear: 1855,
    price: 299,
    image: '',
    inStock: true,
}

let app

beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    setActivePinia(createPinia())
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(props, locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    const router = createRouter({
        history: createMemoryHistory(),
        routes: buildRoutes().map((record) => ({ ...record, component: { render: () => null }, children: undefined })),
    })
    await router.push(locale === 'en' ? '/en/books' : '/books')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(BookCard, props) }) })
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
    return root.querySelector('.book-card')
}

const focusStops = (card) => card.querySelectorAll('a[href], button:not([disabled])').length

describe('BookCard', () => {
    it('links the title to the book page in the current language', async () => {
        expect((await mount({ book: BOOK })).querySelector('.book-card__link').getAttribute('href')).toBe('/books/b1')
        app.unmount()
        expect((await mount({ book: BOOK }, 'en')).querySelector('.book-card__link').getAttribute('href')).toBe(
            '/en/books/b1'
        )
    })

    it('has two focus stops for a book in stock', async () => {
        expect(focusStops(await mount({ book: BOOK }))).toBe(2)
    })

    it('has one focus stop and says out of stock when the book is not in stock', async () => {
        const card = await mount({ book: { ...BOOK, inStock: false } })

        expect(focusStops(card)).toBe(1)
        expect(card.textContent).toContain('Není skladem')
        expect(card.querySelector('.book-card__add')).toBeNull()
    })

    it('names the add button after the book and keeps the visible label in the name', async () => {
        const button = (await mount({ book: BOOK })).querySelector('.book-card__add')

        expect(button.getAttribute('aria-label')).toBe('Přidat do košíku: Babička')
        expect(button.textContent.trim()).toBe('Přidat do košíku')
    })

    it('puts any title into the button name as it is', async () => {
        const card = await mount({ book: { ...BOOK, title: 'A {b} | c @d' } }, 'en')

        expect(card.querySelector('.book-card__add').getAttribute('aria-label')).toBe('Add to cart: A {b} | c @d')
    })

    it('adds one copy once and keeps its label', async () => {
        const card = await mount({ book: BOOK })
        const add = vi.spyOn(useCartStore(), 'add').mockResolvedValue(true)

        card.querySelector('.book-card__add').click()
        await vi.waitFor(() => expect(add).toHaveBeenCalledTimes(1))
        await nextTick()

        expect(add).toHaveBeenCalledWith('b1', 1)
        expect(card.querySelector('.book-card__add').textContent.trim()).toBe('Přidat do košíku')
    })

    it('renders the title as the heading level it is given', async () => {
        const card = await mount({ book: BOOK, headingLevel: 3 })

        expect(card.querySelector('h3 .book-card__link')).not.toBeNull()
    })

    it('shows no admin button to an admin', async () => {
        useAuthStore().$patch({ permissions: ['admin:access'] })
        const card = await mount({ book: BOOK })

        expect(card.textContent).not.toContain('Manage in Admin')
        expect(focusStops(card)).toBe(2)
    })
})
