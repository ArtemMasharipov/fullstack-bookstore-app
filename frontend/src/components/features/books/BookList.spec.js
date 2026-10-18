import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const books = vi.hoisted(() => ({ fetchAll: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import BookList from './BookList.vue'

// A page of the catalogue as GET /books answers it: 24 books in 2 pages of 12
function pageOf(page, { total = 24, pages = 2, prefix = 'Book' } = {}) {
    const count = page <= pages ? Math.min(12, total - (page - 1) * 12) : 0
    return {
        success: true,
        data: Array.from({ length: count }, (_, i) => ({
            id: `${prefix}-${page}-${i + 1}`,
            title: `${prefix} ${page}.${i + 1}`,
            author: { id: 'a1', firstName: 'Karel', lastName: 'Čapek' },
            category: 'Fiction',
            publicationYear: 1920,
            price: 199,
            image: '',
            inStock: true,
        })),
        pagination: { page, limit: 12, total, pages },
    }
}

const EMPTY = { success: true, data: [], pagination: { page: 1, limit: 12, total: 0, pages: 0 } }

function deferred() {
    let resolve
    const promise = new Promise((res) => {
        resolve = res
    })
    return { promise, resolve }
}

let app
let router
let root

beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    books.fetchAll.mockReset()
    books.fetchAll.mockImplementation(async ({ page }) => pageOf(page))
    setActivePinia(createPinia())
})

afterEach(() => {
    vi.useRealTimers()
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(path, locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    router = createRouter({
        history: createMemoryHistory(),
        routes: buildRoutes().map((record) => ({ ...record, component: { render: () => null }, children: undefined })),
    })
    await router.push(path)
    root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(BookList) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await vi.waitFor(() => expect(books.fetchAll).toHaveBeenCalled())
    await flush()
}

// Lets pending answers and re-renders finish
async function flush() {
    for (let i = 0; i < 5; i++) await nextTick()
}

const titles = () => [...root.querySelectorAll('.book-card__link')].map((link) => link.textContent.trim())
const query = () => router.currentRoute.value.query
const buttonNamed = (text) => [...root.querySelectorAll('button')].find((b) => b.textContent.trim() === text)

describe('the catalogue page', () => {
    it('asks for exactly what the address says', async () => {
        await mount('/books?page=2&category=Fiction')

        expect(books.fetchAll).toHaveBeenCalledWith({ page: 2, limit: 12, category: 'Fiction' })
    })

    it('counts the books of the page against the server total', async () => {
        await mount('/books?page=2')

        await vi.waitFor(() =>
            expect(root.querySelector('.catalog-range').textContent).toContain('Zobrazeno 13–24 z 24')
        )
    })

    it('replaces a page that is not a number with the first page', async () => {
        await mount('/books?page=abc')

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/books'))
    })

    it('replaces a page past the end with the last page', async () => {
        await mount('/books?page=9')

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/books?page=2'))
        await vi.waitFor(() => expect(titles()).toContain('Book 2.12'))
    })

    it('pages forward into the history and moves focus to the heading', async () => {
        await mount('/books')
        const push = vi.spyOn(router, 'push')

        await vi.waitFor(() => expect(root.querySelector('.v-pagination')).not.toBeNull())
        const pageTwo = [...root.querySelectorAll('.v-pagination button')].find((b) => b.textContent.trim() === '2')
        pageTwo.click()

        await vi.waitFor(() => expect(query().page).toBe('2'))
        expect(push).toHaveBeenCalled()
        await vi.waitFor(() => expect(document.activeElement).toBe(root.querySelector('h1')))
    })

    it('searches after a pause, replaces the address and resets the page', async () => {
        await mount('/books?page=2')
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const push = vi.spyOn(router, 'push')
        const replace = vi.spyOn(router, 'replace')
        const input = root.querySelector('.catalog-search input')

        input.value = 'Čap'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        vi.advanceTimersByTime(299)

        expect(replace).not.toHaveBeenCalled()
        expect(books.fetchAll).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(1)
        await replace.mock.results[0].value

        expect(query()).toEqual({ q: 'Čap' })
        expect(push).not.toHaveBeenCalled()
    })

    it('asks for two characters and keeps the results for one', async () => {
        await mount('/books')
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const replace = vi.spyOn(router, 'replace')
        const input = root.querySelector('.catalog-search input')

        input.value = 'Č'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        vi.advanceTimersByTime(1000)
        await flush()

        expect(root.textContent).toContain('Zadejte alespoň 2 znaky')
        expect(replace).not.toHaveBeenCalled()
        expect(books.fetchAll).toHaveBeenCalledTimes(1)
        expect(titles()).toHaveLength(12)
    })

    it('presses one category and sends the others back to the first page', async () => {
        await mount('/books?page=2')

        buttonNamed('Fiction').click()

        await vi.waitFor(() => expect(query()).toEqual({ category: 'Fiction' }))
        await flush()
        expect(buttonNamed('Fiction').getAttribute('aria-pressed')).toBe('true')
        expect(buttonNamed('Vše').getAttribute('aria-pressed')).toBe('false')
    })

    it('shows the search and the category of the address', async () => {
        await mount('/books?q=Babi&category=Fiction')

        expect(root.querySelector('.catalog-search input').value).toBe('Babi')
        expect(buttonNamed('Fiction').getAttribute('aria-pressed')).toBe('true')
    })

    it('shows an error with Try again and asks again', async () => {
        books.fetchAll.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mount('/books?page=2')

        // Vuetify's field messages are role="alert" too: the error is the alert with the message
        const alert = await vi.waitFor(() => {
            const found = [...root.querySelectorAll('[role="alert"]')].find((el) =>
                el.textContent.includes(cs.errors.INTERNAL)
            )
            expect(found).toBeDefined()
            return found
        })
        ;[...alert.querySelectorAll('button')].find((b) => b.textContent.trim() === cs.errors.retry).click()

        await vi.waitFor(() => expect(books.fetchAll).toHaveBeenCalledTimes(2))
        expect(books.fetchAll).toHaveBeenLastCalledWith({ page: 2, limit: 12 })
        await vi.waitFor(() => expect(titles()).toHaveLength(12))
    })

    it('offers to reset the filters when nothing matches', async () => {
        books.fetchAll.mockResolvedValue(EMPTY)
        await mount('/books?category=Romance')

        await vi.waitFor(() => expect(root.textContent).toContain(cs.catalog.noResults))
        const reset = [...root.querySelectorAll('a')].find((a) => a.textContent.trim() === cs.catalog.resetFilters)
        expect(reset.getAttribute('href')).toBe('/books')
    })

    it('resets the filters to the catalogue of the current language', async () => {
        books.fetchAll.mockResolvedValue(EMPTY)
        await mount('/en/books?category=Romance', 'en')

        await vi.waitFor(() => expect(root.textContent).toContain(en.catalog.noResults))
        const reset = [...root.querySelectorAll('a')].find((a) => a.textContent.trim() === en.catalog.resetFilters)
        expect(reset.getAttribute('href')).toBe('/en/books')
    })

    it('says the catalogue is empty only without filters', async () => {
        books.fetchAll.mockResolvedValue(EMPTY)
        await mount('/books')

        await vi.waitFor(() => expect(root.textContent).toContain(cs.catalog.empty))
        expect(root.textContent).not.toContain(cs.catalog.noResults)
    })

    it('drops the answer of a page the visitor already left', async () => {
        await mount('/books')
        const left = deferred()
        const current = deferred()
        books.fetchAll.mockReturnValueOnce(left.promise).mockReturnValueOnce(current.promise)

        await router.push('/books?category=Fiction')
        await router.push('/books?category=Science%20Fiction')
        current.resolve(pageOf(1, { total: 3, pages: 1, prefix: 'Current' }))
        await flush()
        left.resolve(pageOf(1, { total: 3, pages: 1, prefix: 'Left' }))
        await flush()

        expect(titles()).toEqual(['Current 1.1', 'Current 1.2', 'Current 1.3'])
    })

    it('does not ask for books when the visitor leaves the catalogue', async () => {
        await mount('/books?page=2')

        await router.push('/books/b1')
        await flush()

        expect(books.fetchAll).toHaveBeenCalledTimes(1)
    })
})
