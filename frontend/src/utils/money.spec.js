import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'
import { activateLocale, loadLocale, t } from '@/i18n'
import { formatMoney, formatPrice } from './helpers/currency'

beforeAll(async () => {
    vi.stubGlobal('fetch', async (url) => {
        const path = new URL(url, 'http://localhost').pathname
        if (path.endsWith('/cs.json')) return new Response(JSON.stringify(cs), { status: 200 })
        if (path.endsWith('/en.json')) return new Response(JSON.stringify(en), { status: 200 })
        throw new Error('Unexpected dictionary URL')
    })
    await loadLocale('cs')
    await loadLocale('en')
    vi.unstubAllGlobals()
})
beforeEach(() => activateLocale('cs'))

describe('CZK display of server amounts in geller', () => {
    it.each([
        ['cs', 'cs-CZ'],
        ['en', 'en-GB'],
    ])('formats 29900 geller as 299 crowns in %s', (language, tag) => {
        const expected = new Intl.NumberFormat(tag, {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(299)

        expect(formatMoney(29900, 'CZK', language)).toBe(expected)
        expect(formatMoney(29900, 'CZK', language)).toBe(formatPrice(299, language))
    })

    it.each([1.5, '100', NaN])('shows a placeholder for %j, never a number', (amount) => {
        expect(formatMoney(amount)).toBe(t('common.notAvailable'))
    })
})

describe('CZK display in major units', () => {
    it.each(['cs', 'en'])('formats 299.90 without conversion in %s', (locale) => {
        const expected = new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(299.9)
        expect(formatPrice(299.9, locale)).toBe(expected)
    })
    it('displays a valid zero price', () => {
        expect(formatPrice(0, 'en')).toBe(
            new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'CZK' }).format(0)
        )
    })
    it.each([null, undefined, NaN, Infinity, -Infinity, '299.90', '', false, {}])(
        'does not turn invalid %s into money',
        (value) => {
            expect(formatPrice(value)).toBe(t('common.notAvailable'))
        }
    )
    it('updates a computed display after locale activation without changing the amount', () => {
        const amount = ref(299.9)
        const display = computed(() => formatPrice(amount.value))
        expect(display.value).toBe(new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(299.9))
        activateLocale('en')
        expect(display.value).toBe(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'CZK' }).format(299.9))
        expect(amount.value).toBe(299.9)
    })
    it('localizes missing-price display after locale activation', () => {
        const display = computed(() => formatPrice(null))
        expect(display.value).toBe(cs.common.notAvailable)
        activateLocale('en')
        expect(display.value).toBe(en.common.notAvailable)
    })
})
import { createApp, createSSRApp, h, nextTick, reactive } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { createMemoryHistory, createRouter } from 'vue-router'
import BookCard from '@/components/features/books/BookCard.vue'
import BookDialog from '@/components/features/admin/BookDialog.vue'

async function renderConsumer(component, props) {
    const context = {}
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: BookCard }] })
    await router.push('/')
    const app = createSSRApp({ render: () => h(components.VApp, {}, { default: () => h(component, props) }) })
        .use(createPinia())
        .use(router)
        .use(createVuetify({ components }))
    const html = await renderToString(app, context)
    const root = document.createElement('div')
    root.innerHTML = html + Object.values(context.teleports || {}).join('')
    return root
}

it('renders a zero book price instead of a missing-price fallback', async () => {
    const book = { id: 'zero', title: 'Free book', price: 0, inStock: false }
    const root = await renderConsumer(BookCard, { book })
    expect(root.textContent).toContain(new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK' }).format(0))
    expect(book.price).toBe(0)
})

it('shows a CZK editing prefix while retaining the numeric major-unit value', async () => {
    const book = { id: 'book', title: 'Example', price: 299.9 }
    const props = reactive({ book, visible: false, attach: true, eager: true })
    const root = document.createElement('div')
    document.body.append(root)
    const app = createApp({ render: () => h(components.VApp, {}, { default: () => h(BookDialog, props) }) }).use(
        createVuetify({ components })
    )
    app.mount(root)
    try {
        props.visible = true
        await nextTick()
        expect(root.textContent).toContain('CZK')
        expect(root.querySelector('input[type="number"]')?.value).toBe('299.9')
        expect(book.price).toBe(299.9)
    } finally {
        app.unmount()
        root.remove()
    }
})
