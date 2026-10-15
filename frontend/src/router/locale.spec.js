import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import enMessages from '@/i18n/locales/en.json'
import csMessages from '@/i18n/locales/cs.json'
import { createLocaleRuntime, i18n, loadLocale, activateLocale } from '@/i18n'
import { useCartStore } from '@/stores/cart'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import AdminSidebar from '@/components/layout/admin/AdminSidebar.vue'
import AdminHeader from '@/components/layout/admin/AdminHeader.vue'
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { buildRoutes } from './buildRoutes'
import { installLocaleRouting, localeRoute, routeLocale, switchLocaleTarget } from './locale'
import unifiedGuard from './guards/unified'

const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}
const english = { default: { routes: { Books: 'Books', BookDetails: 'Book details', Home: 'Home', Login: 'Login' } } }
const czech = {
    default: { routes: { Books: 'Knihy', BookDetails: 'Detail knihy', Home: 'Domů', Login: 'Přihlášení' } },
}
function makeRouter() {
    const prepare = (r) => ({
        ...r,
        component: { render: () => null },
        ...(r.children ? { children: r.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}
function runtime(en = async () => english) {
    return createLocaleRuntime({ loaders: { cs: async () => czech, en } })
}
beforeEach(() => {
    vi.stubGlobal('fetch', async (url) => {
        const path = new URL(url, 'http://localhost').pathname
        if (path.endsWith('/cs.json')) return new Response(JSON.stringify(csMessages), { status: 200 })
        if (path.endsWith('/en.json')) return new Response(JSON.stringify(enMessages), { status: 200 })
        throw new Error('Unexpected dictionary URL')
    })
})
afterEach(() => {
    vi.unstubAllGlobals()
    document.body.replaceChildren()
    localStorage.clear()
    document.documentElement.lang = 'cs'
})

describe('locale navigation targets', () => {
    it('switches a detail without losing business params, query or hash', () => {
        expect(
            switchLocaleTarget(
                {
                    name: 'BookDetails',
                    params: { id: 'abc', locale: '' },
                    query: { sort: 'price' },
                    hash: '#description',
                },
                'en'
            )
        ).toEqual({
            name: 'BookDetails',
            params: { id: 'abc', locale: 'en' },
            query: { sort: 'price' },
            hash: '#description',
        })
        expect(localeRoute('Login', {}, 'en')).toEqual({ name: 'Login', params: { locale: 'en' } })
        expect(routeLocale({ params: { locale: 'en' } })).toBe('en')
        expect(routeLocale({ params: { locale: 'cs' } })).toBe('cs')
    })
    it('preserves a repeatable 404 pathMatch in both directions', async () => {
        const router = makeRouter()
        await router.push('/en/unknown/a?x=1#missing')
        await router.push(switchLocaleTarget(router.currentRoute.value, 'cs'))
        expect(router.currentRoute.value.fullPath).toBe('/unknown/a?x=1#missing')
        expect(router.currentRoute.value.params.pathMatch).toEqual(['unknown', 'a'])
        await router.push(switchLocaleTarget(router.currentRoute.value, 'en'))
        expect(router.currentRoute.value.fullPath).toBe('/en/unknown/a?x=1#missing')
    })
})

describe('locale routing lifecycle', () => {
    it('activates the initial EN language and localized title only after successful navigation', async () => {
        const router = makeRouter()
        const state = runtime()
        installLocaleRouting(router, { runtime: state })
        await router.push('/en/books')
        await router.isReady()
        expect(state.locale.value).toBe('en')
        expect(document.documentElement.lang).toBe('en')
        expect(document.title).toBe('Books | Bookstore')
        await router.push('/books')
        expect(document.title).toBe('Knihy | Bookstore')
        expect(state.locale.value).toBe('cs')
    })
    it('keeps the previous URL and language on failed imports and retries the original detail', async () => {
        let fail = true
        let error
        const state = runtime(async () => {
            if (fail) throw new Error('offline')
            return english
        })
        const router = makeRouter()
        installLocaleRouting(router, {
            runtime: state,
            onLoadError: (event) => {
                error = event
            },
        })
        await router.push('/books')
        await router.push('/en/books/abc?sort=price#description')
        expect(router.currentRoute.value.fullPath).toBe('/books')
        expect(state.locale.value).toBe('cs')
        expect(document.documentElement.lang).toBe('cs')
        expect(document.title).toBe('Knihy | Bookstore')
        expect(error.locale).toBe('en')
        fail = false
        await error.retry()
        expect(router.currentRoute.value.fullPath).toBe('/en/books/abc?sort=price#description')
        expect(document.title).toBe('Book details | Bookstore')
    })
    it('does not activate a locale when a later guard aborts', async () => {
        const router = makeRouter()
        const state = runtime()
        installLocaleRouting(router, { runtime: state })
        await router.push('/books')
        router.beforeEach((to) => (to.params.locale === 'en' ? false : undefined))
        await router.push('/en/books')
        expect(router.currentRoute.value.fullPath).toBe('/books')
        expect(state.locale.value).toBe('cs')
        expect(document.title).toBe('Knihy | Bookstore')
    })
    it('does not activate an older load when a newer navigation wins', async () => {
        const pending = deferred()
        const started = deferred()
        const state = runtime(() => {
            started.resolve()
            return pending.promise
        })
        const router = makeRouter()
        installLocaleRouting(router, { runtime: state })
        await router.push('/books')
        const stale = router.push('/en/books')
        await started.promise
        await router.push('/')
        pending.resolve(english)
        await stale
        expect(router.currentRoute.value.fullPath).toBe('/')
        expect(state.locale.value).toBe('cs')
        expect(document.title).toBe('Domů | Bookstore')
    })
    it('uses the destination locale after an auth redirect without activating the protected page', async () => {
        setActivePinia(createPinia())
        const router = makeRouter()
        const state = runtime()
        installLocaleRouting(router, { runtime: state })
        router.beforeEach(unifiedGuard)
        await router.push('/en/orders/abc')
        expect(router.currentRoute.value.fullPath).toBe('/en/login')
        expect(state.locale.value).toBe('en')
        expect(document.title).toBe('Login | Bookstore')
    })
})

describe('native language control', () => {
    it('switches the current detail, updates selected state and retains cart data', async () => {
        const pinia = createPinia()
        setActivePinia(pinia)
        const cart = useCartStore()
        cart.items = [{ bookId: { _id: 'local-book', title: 'Local book' }, quantity: 2, price: 299.9 }]
        await loadLocale('cs')
        activateLocale('cs')
        const router = makeRouter()
        installLocaleRouting(router)
        await router.push('/books/abc?sort=price#description')
        const root = document.createElement('div')
        document.body.append(root)
        const app = createApp(LanguageSwitcher).use(pinia).use(i18n).use(router)
        app.mount(root)
        const button = root.querySelector('button[lang="en"]')
        expect(button).toBeInstanceOf(HTMLButtonElement)
        expect(button.getAttribute('aria-pressed')).toBe('false')
        button.focus()
        button.click()
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/en/books/abc?sort=price#description'))
        await nextTick()
        expect(button.getAttribute('aria-pressed')).toBe('true')
        expect(document.activeElement).toBe(button)
        expect(root.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Language')
        expect(cart.items).toEqual([{ bookId: { _id: 'local-book', title: 'Local book' }, quantity: 2, price: 299.9 }])
        app.unmount()
    })
})

describe('localized admin navigation', () => {
    it('updates system and main titles, subtitles and link URLs when the locale changes', async () => {
        const router = makeRouter()
        const pinia = createPinia()
        setActivePinia(pinia)
        installLocaleRouting(router)
        await router.push('/en/admin')
        const root = document.createElement('div')
        document.body.append(root)
        const app = createApp({
            render: () => h(components.VApp, {}, { default: () => [h(AdminHeader), h(AdminSidebar)] }),
        })
            .use(pinia)
            .use(i18n)
            .use(router)
            .use(createVuetify({ components }))
        app.mount(root)
        await nextTick()
        expect(root.querySelector('a[href="/en/admin/settings"]')?.textContent).toContain('Settings')
        expect(root.querySelector('a[href="/en/admin/books"]')?.textContent).toContain('Manage inventory')
        expect(root.querySelector('button[lang="cs"]')).toBeInstanceOf(HTMLButtonElement)
        await router.push('/admin')
        await nextTick()
        expect(root.querySelector('a[href="/admin/settings"]')?.textContent).toContain('Nastavení')
        expect(root.querySelector('a[href="/admin/books"]')?.textContent).toContain('Správa knih')
        app.unmount()
    })
})
