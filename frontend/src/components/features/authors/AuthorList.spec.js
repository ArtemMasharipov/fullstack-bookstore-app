import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const authors = vi.hoisted(() => ({ fetchAll: vi.fn() }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import AuthorList from './AuthorList.vue'

// More authors than the API's default page of 20, in the order the server answers: 24 numbered ones, then Vančura
const AUTHORS = [
    ...Array.from({ length: 24 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0')
        return { id: `a-${n}`, firstName: 'Jan', lastName: `Autor ${n}`, bio: '', booksCount: 0 }
    }),
    { id: 'a-25', firstName: 'Vladislav', lastName: 'Vančura', bio: '', booksCount: 2 },
]
const ALL_NAMES = AUTHORS.map((author) => `${author.firstName} ${author.lastName}`)

// GET /authors as the server answers it: the search on first or last name, then the page
function serve({ page = 1, limit = 20, search } = {}) {
    const needle = search?.toLowerCase()
    const found = needle
        ? AUTHORS.filter((a) => [a.firstName, a.lastName].some((name) => name.toLowerCase().includes(needle)))
        : AUTHORS
    return {
        success: true,
        data: found.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: found.length, pages: Math.ceil(found.length / limit) },
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
    authors.fetchAll.mockReset()
    authors.fetchAll.mockImplementation(async (params) => serve(params))
})

afterEach(() => {
    vi.useRealTimers()
    app?.unmount()
    app = undefined
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
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(AuthorList) }) })
        .use(createPinia())
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenCalled())
    await flush()
}

// Lets pending answers and re-renders finish
async function flush() {
    for (let i = 0; i < 5; i++) await nextTick()
}

const names = () => [...root.querySelectorAll('.author-card .v-card-title')].map((title) => title.textContent.trim())
const query = () => router.currentRoute.value.query
const pageButton = (n) =>
    [...root.querySelectorAll('.v-pagination button')].find((button) => button.textContent.trim() === String(n))
const alerts = () => [...root.querySelectorAll('[role="alert"]')]

describe('the public author list', () => {
    it('asks the server for the page and the search of the address', async () => {
        await mount('/authors?page=2&q=Autor')

        expect(authors.fetchAll).toHaveBeenCalledWith({ page: 2, limit: 12, search: 'Autor' })
    })

    it('reaches every one of more than 20 authors through the pages', async () => {
        await mount('/authors')
        const seen = [...names()]

        for (const n of [2, 3]) {
            await vi.waitFor(() => expect(pageButton(n)).toBeDefined())
            pageButton(n).click()
            await vi.waitFor(() => expect(query().page).toBe(String(n)))
            await vi.waitFor(() => expect(names()).not.toContain(seen.at(-1)))
            seen.push(...names())
        }

        expect(seen).toEqual(ALL_NAMES)
        expect(root.querySelector('.authors-range').textContent).toContain('Zobrazeno 25–25 z 25')
    })

    it('finds an author who is not on the first page', async () => {
        await mount('/authors')
        expect(names()).not.toContain('Vladislav Vančura')
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const replace = vi.spyOn(router, 'replace')
        const input = root.querySelector('.authors-search input')

        input.value = 'Vanč'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        vi.advanceTimersByTime(300)
        await replace.mock.results[0].value
        vi.useRealTimers()

        expect(query()).toEqual({ q: 'Vanč' })
        expect(authors.fetchAll).toHaveBeenLastCalledWith({ page: 1, limit: 12, search: 'Vanč' })
        await vi.waitFor(() => expect(names()).toEqual(['Vladislav Vančura']))
    })

    it('pages with keyboard-operable buttons into the history and focuses the heading', async () => {
        await mount('/authors')
        const push = vi.spyOn(router, 'push')

        await vi.waitFor(() => expect(pageButton(2)).toBeDefined())
        // Real buttons: Tab reaches them and Enter or Space presses them
        expect(pageButton(2).tagName).toBe('BUTTON')
        expect(pageButton(1).getAttribute('aria-current')).toBe('true')
        pageButton(2).click()

        await vi.waitFor(() => expect(query()).toEqual({ page: '2' }))
        expect(push).toHaveBeenCalled()
        await vi.waitFor(() => expect(document.activeElement).toBe(root.querySelector('h1')))
        expect(root.querySelector('h1').textContent).toContain(cs.authors.title)
    })

    it.each([
        ['cs', '/authors', '/authors/a-01'],
        ['en', '/en/authors', '/en/authors/a-01'],
    ])('%s opens an author through a real link', async (locale, path, href) => {
        await mount(path, locale)

        const card = root.querySelector('.author-card')
        expect(card.tagName).toBe('A')
        expect(card.getAttribute('href')).toBe(href)
        card.click()
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe(href))
    })

    it('drops the answer of a page the visitor already left', async () => {
        await mount('/authors')
        const left = deferred()
        const current = deferred()
        authors.fetchAll.mockReturnValueOnce(left.promise).mockReturnValueOnce(current.promise)

        await router.push('/authors?page=2')
        await router.push('/authors?page=3')
        current.resolve(serve({ page: 3, limit: 12 }))
        await flush()
        left.resolve(serve({ page: 2, limit: 12 }))
        await flush()

        expect(names()).toEqual(['Vladislav Vančura'])
    })

    it('replaces a page past the end with the last page', async () => {
        await mount('/authors?page=9')

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/authors?page=3'))
        await vi.waitFor(() => expect(names()).toEqual(['Vladislav Vančura']))
    })

    it('replaces an address it cannot read with its canonical form', async () => {
        await mount('/authors?page=abc&q=x')

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/authors'))
    })

    it('searches after a pause, replaces the address and resets the page', async () => {
        await mount('/authors?page=2')
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const push = vi.spyOn(router, 'push')
        const replace = vi.spyOn(router, 'replace')
        const input = root.querySelector('.authors-search input')

        input.value = 'Autor 1'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        vi.advanceTimersByTime(299)

        expect(replace).not.toHaveBeenCalled()
        expect(authors.fetchAll).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(1)
        await replace.mock.results[0].value

        expect(query()).toEqual({ q: 'Autor 1' })
        expect(push).not.toHaveBeenCalled()
    })

    it('asks for two characters and keeps the list for one', async () => {
        await mount('/authors')
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
        const replace = vi.spyOn(router, 'replace')
        const input = root.querySelector('.authors-search input')

        input.value = 'V'
        input.dispatchEvent(new Event('input'))
        await nextTick()
        vi.advanceTimersByTime(1000)
        await flush()

        expect(root.textContent).toContain(cs.authors.search.hint)
        expect(replace).not.toHaveBeenCalled()
        expect(authors.fetchAll).toHaveBeenCalledTimes(1)
        expect(names()).toHaveLength(12)
    })

    it('shows the search of the address', async () => {
        await mount('/authors?q=Vanč')

        expect(root.querySelector('.authors-search input').value).toBe('Vanč')
    })

    it('shows an error with Retry as the only alert and asks again', async () => {
        authors.fetchAll.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mount('/authors?page=2')

        await vi.waitFor(() => expect(root.textContent).toContain(cs.errors.INTERNAL))
        // One alert and no other status on the page: screen readers hear the error alone
        expect(alerts()).toHaveLength(1)
        expect(root.querySelectorAll('[role="status"]')).toHaveLength(0)
        ;[...alerts()[0].querySelectorAll('button')].find((b) => b.textContent.trim() === cs.errors.retry).click()

        await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenCalledTimes(2))
        expect(authors.fetchAll).toHaveBeenLastCalledWith({ page: 2, limit: 12 })
        await vi.waitFor(() => expect(names()).toHaveLength(12))
    })

    it('offers to clear the search when no author matches', async () => {
        await mount('/en/authors?q=Nobody', 'en')

        await vi.waitFor(() => expect(root.textContent).toContain(en.authors.noResults))
        const clear = [...root.querySelectorAll('a')].find((a) => a.textContent.trim() === en.authors.clearSearch)
        expect(clear.getAttribute('href')).toBe('/en/authors')
    })

    it('says there are no authors only without a search', async () => {
        authors.fetchAll.mockResolvedValue(EMPTY)
        await mount('/authors')

        await vi.waitFor(() => expect(root.textContent).toContain(cs.authors.empty))
        expect(root.textContent).not.toContain(cs.authors.noResults)
    })

    it('does not ask for authors when the visitor leaves the list', async () => {
        await mount('/authors?page=2')

        await router.push('/authors/a-13')
        await flush()

        expect(authors.fetchAll).toHaveBeenCalledTimes(1)
    })
})
