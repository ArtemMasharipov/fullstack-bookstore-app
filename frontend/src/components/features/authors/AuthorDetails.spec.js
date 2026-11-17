import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const authors = vi.hoisted(() => ({ fetchById: vi.fn() }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthorsStore } from '@/stores'

const AUTHORS = {
    a2: { id: 'a2', firstName: 'Karel', lastName: 'Čapek', bio: 'Czech writer', booksCount: 0 },
    a3: { id: 'a3', firstName: 'Jaroslav', lastName: 'Hašek', bio: 'Author of Švejk', booksCount: 0 },
}

// GET /authors/:id?includeBooks=true as the API adapter resolves it
const answer = (id) => ({ success: true, data: { author: AUTHORS[id], books: [] } })

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
    authors.fetchById.mockReset()
    authors.fetchById.mockImplementation(async (id) => answer(id))
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

// The real author route and view, so a switch between two authors reuses the same page component
async function mount(path, locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    await router.push(path)
    root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(RouterView) }) })
        .use(createPinia())
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
}

async function flush() {
    for (let i = 0; i < 5; i++) await nextTick()
}

describe('the author page', () => {
    it('loads the author again when the address switches to another author', async () => {
        await mount('/authors/a2')
        await vi.waitFor(() => expect(root.textContent).toContain('Czech writer'))

        await router.push('/authors/a3')

        await vi.waitFor(() => expect(root.textContent).toContain('Author of Švejk'))
        expect(authors.fetchById).toHaveBeenLastCalledWith('a3', { includeBooks: true })
        expect(root.textContent).not.toContain('Czech writer')
    })

    it('shows the newest author when answers arrive out of order', async () => {
        const left = deferred()
        const current = deferred()
        authors.fetchById.mockReturnValueOnce(left.promise).mockReturnValueOnce(current.promise)
        await mount('/authors/a2')
        await vi.waitFor(() => expect(authors.fetchById).toHaveBeenCalledTimes(1))

        await router.push('/authors/a3')
        await vi.waitFor(() => expect(authors.fetchById).toHaveBeenCalledTimes(2))
        current.resolve(answer('a3'))
        await vi.waitFor(() => expect(root.textContent).toContain('Author of Švejk'))
        left.resolve(answer('a2'))
        await flush()

        expect(root.textContent).toContain('Author of Švejk')
        expect(root.textContent).not.toContain('Czech writer')
    })

    it('shows a failed author with Retry and loads it again', async () => {
        authors.fetchById.mockRejectedValueOnce({ code: 'NOT_FOUND' })
        await mount('/en/authors/a2', 'en')

        const alert = await vi.waitFor(() => {
            const found = [...root.querySelectorAll('[role="alert"]')].find((el) =>
                el.textContent.includes(en.errors.NOT_FOUND)
            )
            expect(found).toBeDefined()
            return found
        })
        ;[...alert.querySelectorAll('button')].find((b) => b.textContent.trim() === en.errors.retry).click()

        await vi.waitFor(() => expect(root.textContent).toContain('Czech writer'))
        expect(authors.fetchById).toHaveBeenCalledTimes(2)
        expect(root.querySelector('.v-breadcrumbs a').textContent).toContain(en.routes.Authors)
    })

    it.each([
        ['cs', '/authors/a2', cs],
        ['en', '/en/authors/a2', en],
    ])('%s speaks the language of the page', async (locale, path, words) => {
        await mount(path, locale)

        await vi.waitFor(() => expect(root.textContent).toContain(words.authors.noBooks))
        expect(root.querySelector('.v-breadcrumbs a').textContent).toContain(words.routes.Authors)
    })

    it('keeps showing the author while the author list loads', async () => {
        await mount('/authors/a2')
        await vi.waitFor(() => expect(root.textContent).toContain('Czech writer'))

        useAuthorsStore().loading = true
        await flush()

        expect(root.textContent).toContain('Czech writer')
    })
})
