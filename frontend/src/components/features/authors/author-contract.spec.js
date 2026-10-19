import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api/baseApi', () => ({ default: api, setUnauthorizedHandler: () => {} }))
import { activateLocale, i18n, loadLocale } from '@/i18n'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'
import { buildRoutes } from '@/router/buildRoutes'
import { installLocaleRouting } from '@/router/locale'

const AUTHOR = {
    id: 'a2',
    firstName: 'Karel',
    lastName: 'Čapek',
    bio: 'Writer biography',
    booksCount: 1,
    createdAt: '2026-10-19T00:00:00Z',
    updatedAt: '2026-10-19T00:00:00Z',
}
const BOOK = {
    id: 'b1',
    title: 'Krakatit',
    author: { id: 'a2', firstName: 'Karel', lastName: 'Čapek' },
    publicationYear: 1924,
    category: 'Fiction',
    description: '',
    price: 100,
    inStock: true,
    createdAt: '2026-10-19T00:00:00Z',
    updatedAt: '2026-10-19T00:00:00Z',
}
let app
beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    api.get.mockImplementation(async (url) => ({
        data:
            url === '/authors'
                ? { success: true, data: [AUTHOR], pagination: { page: 1, limit: 20, total: 1, pages: 1 } }
                : { success: true, data: { author: AUTHOR, books: [BOOK] } },
    }))
})
afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

describe('canonical author data on existing public pages', () => {
    it.each(['cs', 'en'])('%s opens the author by id and keeps its language', async (locale) => {
        await loadLocale(locale)
        activateLocale(locale)
        const prefix = locale === 'en' ? '/en' : ''
        const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
        installLocaleRouting(router)
        await router.push(`${prefix}/authors`)
        const root = document.createElement('div')
        document.body.append(root)
        app = createApp({ render: () => h(components.VApp, null, { default: () => h(RouterView) }) })
            .use(createPinia())
            .use(router)
            .use(i18n)
            .use(createVuetify({ components, directives }))
        app.mount(root)
        await vi.waitFor(() => expect(root.textContent).toContain('Karel Čapek'))
        expect(root.querySelector('.author-card').textContent).toContain('1 book')
        root.querySelector('.author-card').click()
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe(`${prefix}/authors/a2`))
        await vi.waitFor(() => expect(root.textContent).toContain('Writer biography'))
        expect(root.textContent).toContain('Krakatit')
        expect(root.querySelector('.v-breadcrumbs a').getAttribute('href')).toBe(`${prefix}/authors`)
    })
})
