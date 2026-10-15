import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { useCartStore } from '@/stores/cart'
import CartItem from './CartItem.vue'

const BOOK = 'a'.repeat(24)
const lineOf = (overrides = {}) => ({
    bookId: BOOK,
    title: 'Babička',
    authorName: 'Božena Němcová',
    image: null,
    unitPrice: 29900,
    quantity: 2,
    lineTotal: 59800,
    available: true,
    unavailableReason: null,
    ...overrides,
})

let app
let cart

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('en')
    setActivePinia(createPinia())
    cart = useCartStore()
    vi.spyOn(cart, 'setQuantity').mockResolvedValue(true)
    vi.spyOn(cart, 'remove').mockResolvedValue(true)
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

async function mount(line) {
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(CartItem, { line }) }) })
        .use(i18n)
        .use(createVuetify({ components }))
    app.mount(root)
    await nextTick()
}

const byLabel = (label) => document.querySelector(`button[aria-label="${label}"]`)

describe('CartItem', () => {
    it('names its quantity buttons after the book', async () => {
        await mount(lineOf())

        expect(byLabel(t('cart.increase', { title: 'Babička' }))).not.toBeNull()
        expect(byLabel(t('cart.decrease', { title: 'Babička' }))).not.toBeNull()
    })

    it('cannot go below one copy, and keeps the button focusable', async () => {
        await mount(lineOf({ quantity: 1, lineTotal: 29900 }))
        const decrease = byLabel(t('cart.decrease', { title: 'Babička' }))

        decrease.click()

        expect(decrease.getAttribute('aria-disabled')).toBe('true')
        expect(decrease.disabled).toBe(false)
        expect(cart.setQuantity).not.toHaveBeenCalled()
    })

    it('asks the store once for one more copy', async () => {
        await mount(lineOf())

        byLabel(t('cart.increase', { title: 'Babička' })).click()

        expect(cart.setQuantity).toHaveBeenCalledTimes(1)
        expect(cart.setQuantity).toHaveBeenCalledWith(BOOK, 3)
    })

    it('ignores every action of the line while its change is pending, without dropping the focus', async () => {
        cart.$patch({ pending: [BOOK] })
        await mount(lineOf())
        const buttons = ['increase', 'decrease', 'remove'].map((key) => byLabel(t(`cart.${key}`, { title: 'Babička' })))

        buttons.forEach((button) => button.click())
        await nextTick()

        for (const button of buttons) {
            expect(button.getAttribute('aria-disabled')).toBe('true')
            expect(button.disabled).toBe(false)
        }
        expect(cart.setQuantity).not.toHaveBeenCalled()
        expect(document.body.textContent).not.toContain(t('cart.removeConfirm', { title: 'Babička' }))
    })

    it('explains why a line cannot be bought and offers only its removal', async () => {
        await mount(
            lineOf({
                title: null,
                unitPrice: 0,
                lineTotal: 0,
                available: false,
                unavailableReason: 'DELETED',
            })
        )

        const title = t('cart.unavailable.DELETED')
        expect(document.body.textContent).toContain(title)
        expect(byLabel(t('cart.remove', { title }))).not.toBeNull()
        expect(document.querySelector('button[aria-label^="Increase"]')).toBeNull()
    })
})
