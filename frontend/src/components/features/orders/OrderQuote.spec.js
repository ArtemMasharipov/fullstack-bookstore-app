import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { formatMoney } from '@/utils/money'
import OrderQuote from './OrderQuote.vue'

let app

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(quote) {
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(OrderQuote, { quote }) })
        .use(i18n)
        .use(createVuetify({ components }))
    app.mount(root)
    await nextTick()
    return root
}

describe('OrderQuote', () => {
    it('shows the VAT included in a current total, without a tax line', async () => {
        const root = await mount({
            currency: 'CZK',
            itemsTotal: 19900,
            shipping: 9900,
            vatIncluded: true,
            vatAmount: 2100,
            total: 29800,
        })

        expect(root.textContent).toContain(formatMoney(19900))
        expect(root.textContent).toContain(formatMoney(9900))
        expect(root.textContent).toContain(formatMoney(29800))
        expect(root.textContent).toContain(t('cart.vatIncluded', { amount: formatMoney(2100) }))
        expect(root.textContent).not.toContain(t('orders.tax'))
    })

    it('shows the tax of an older order as a line of its total', async () => {
        const root = await mount({
            currency: 'CZK',
            itemsTotal: 2598,
            shipping: 1000,
            vatIncluded: false,
            vatAmount: 260,
            total: 3858,
        })

        expect(root.textContent).toContain(t('orders.tax'))
        expect(root.textContent).toContain(formatMoney(260))
        expect(root.textContent).toContain(formatMoney(3858))
        expect(root.textContent).not.toContain(t('cart.vatIncluded', { amount: formatMoney(260) }))
    })

    it('says free shipping when there is none to pay', async () => {
        const root = await mount({
            currency: 'CZK',
            itemsTotal: 120000,
            shipping: 0,
            vatIncluded: true,
            vatAmount: 0,
            total: 120000,
        })

        expect(root.textContent).toContain(t('cart.shippingFree'))
    })
})
