import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useCartStore } from '@/stores/cart'
import { formatMoney } from '@/utils/money'
import CartList from './CartList.vue'

const BOOK = 'a'.repeat(24)
const line = {
    bookId: BOOK,
    title: 'Babička',
    authorName: 'Božena Němcová',
    image: null,
    unitPrice: 29900,
    quantity: 1,
    lineTotal: 29900,
    available: true,
    unavailableReason: null,
}
const quote = {
    currency: 'CZK',
    itemsTotal: 29900,
    shipping: 9900,
    vatIncluded: true,
    vatAmount: 0,
    total: 39800,
    freeShippingThreshold: 100000,
}

let app
let cart

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('cs')
    localStorage.clear()
    setActivePinia(createPinia())
    cart = useCartStore()
    vi.spyOn(cart, 'load').mockResolvedValue()
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

async function mount(state) {
    cart.$patch(state)
    const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(CartList) }) })
        .use(i18n)
        .use(createVuetify({ components }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

describe('CartList', () => {
    it('shows skeletons and no lines while the cart loads', async () => {
        await mount({ status: 'loading' })

        expect(document.querySelector('.v-skeleton-loader')).not.toBeNull()
        expect(document.querySelector('.cart-line')).toBeNull()
    })

    it('says the cart is empty and links to the catalogue', async () => {
        await mount({ status: 'ready', lines: [], quote: null })

        expect(document.body.textContent).toContain(t('cart.empty'))
        expect(document.querySelector('a[href="/books"]')).not.toBeNull()
    })

    it('shows an error with a retry that loads the cart again', async () => {
        await mount({ status: 'error', error: 'errors.UNKNOWN' })
        cart.load.mockClear()

        const alert = document.querySelector('[role="alert"]')
        const retry = [...alert.querySelectorAll('button')].find(
            (button) => button.textContent.trim() === t('errors.retry')
        )
        retry.click()

        expect(cart.load).toHaveBeenCalledTimes(1)
    })

    it('shows the lines and the total of the server quote', async () => {
        await mount({ status: 'ready', lines: [line], quote })

        expect(document.querySelectorAll('.cart-line')).toHaveLength(1)
        expect(document.body.textContent).toContain(formatMoney(39800))
    })

    it('refreshes the cart when the page opens', async () => {
        await mount({ status: 'ready', lines: [line], quote })

        expect(cart.load).toHaveBeenCalledTimes(1)
    })
})
