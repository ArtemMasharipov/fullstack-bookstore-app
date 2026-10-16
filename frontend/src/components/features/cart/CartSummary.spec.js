import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore } from '@/stores/auth'
import CartSummary from './CartSummary.vue'

const quote = {
    currency: 'CZK',
    itemsTotal: 19900,
    shipping: 9900,
    vatIncluded: true,
    vatAmount: 0,
    total: 29800,
    freeShippingThreshold: 100000,
}

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

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    localStorage.clear()
    setActivePinia(createPinia())
    await loadLocale('en')
    activateLocale('en')
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount() {
    router = testRouter()
    await router.push('/en/cart')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(CartSummary, { quote }) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

const linkWith = (label) =>
    router.resolve([...document.querySelectorAll('a')].find((a) => a.textContent.includes(label)).getAttribute('href'))

describe('CartSummary', () => {
    it('sends a guest to sign in with the way back to checkout', async () => {
        await mount()

        const login = linkWith(t('cart.loginToCheckout'))

        expect(login.path).toBe('/en/login')
        expect(login.query.redirect).toBe('/en/checkout')
    })

    it('sends a signed-in user straight to checkout', async () => {
        useAuthStore().$patch({ token: 'signed-in' })
        await mount()

        expect(linkWith(t('cart.checkout')).fullPath).toBe('/en/checkout')
    })
})
