import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore } from '@/stores'
import AdminLayout from './AdminLayout.vue'

const dictionaries = { cs, en }
const Page = { render: () => h('p', 'page') }

// The real routes with a stand-in page; a group keeps its own (absent) component
const prepare = (record) =>
    record.children ? { ...record, children: record.children.map(prepare) } : { ...record, component: Page }

let app
let router

beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(path, locale) {
    await loadLocale(locale)
    activateLocale(locale)
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().$patch({ user: { id: 'u1', username: 'admin', role: 'admin' } })
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
    await router.push(path)
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(AdminLayout) }) })
        .use(pinia)
        .use(i18n)
        .use(router)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await router.isReady()
    await nextTick()
}

const current = () => [...document.querySelectorAll('nav [aria-current="page"]')]

describe.each(['cs', 'en'])('AdminLayout (%s)', (locale) => {
    const words = dictionaries[locale]
    const prefix = locale === 'en' ? '/en' : ''

    it('renders one banner, one navigation landmark and one main with the section heading', async () => {
        await mount(`${prefix}/admin/books`, locale)

        expect(document.querySelectorAll('header')).toHaveLength(1)
        expect(document.querySelectorAll('nav')).toHaveLength(1)
        expect(document.querySelector('nav').getAttribute('aria-label')).toBe(words.admin.navLabel)
        expect(document.querySelectorAll('main')).toHaveLength(1)
        const headings = document.querySelectorAll('h1')
        expect(headings).toHaveLength(1)
        expect(headings[0].textContent.trim()).toBe(words.routes.AdminBooks)
        expect(document.querySelector('main h1')).toBe(headings[0])
        expect(document.querySelector('main').textContent).toContain('page')
    })

    it('marks exactly one link as the current page', async () => {
        await mount(`${prefix}/admin`, locale)

        expect(current()).toHaveLength(1)
        expect(current()[0].textContent).toContain(words.routes.AdminDashboard)

        await router.push(`${prefix}/admin/books`)
        await nextTick()

        expect(current()).toHaveLength(1)
        expect(current()[0].textContent).toContain(words.routes.AdminBooks)
    })

    it('has no settings link, no search field and no listbox in the navigation', async () => {
        await mount(`${prefix}/admin`, locale)

        expect(document.querySelector('a[href$="/admin/settings"]')).toBeNull()
        expect(document.querySelector('header input, nav input')).toBeNull()
        expect(document.querySelector('nav [role="listbox"]')).toBeNull()
        expect(document.querySelector('nav').closest('[role="listbox"]')).toBeNull()
    })

    it('links every section in the page language', async () => {
        await mount(`${prefix}/admin`, locale)

        expect([...document.querySelectorAll('nav a')].map((link) => link.getAttribute('href'))).toEqual(
            ['', '/books', '/authors', '/orders', '/users'].map((section) => `${prefix}/admin${section}`)
        )
    })
})
