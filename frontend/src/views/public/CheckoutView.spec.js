import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const api = vi.hoisted(() => ({ create: vi.fn() }))
const notify = vi.hoisted(() => ({ showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
vi.mock('@/composables/useNotifications', () => ({ useNotifications: () => notify }))

import { activateLocale, i18n, loadLocale, t } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useCartStore } from '@/stores/cart'
import { formatMoney } from '@/utils/money'
import CheckoutView from './CheckoutView.vue'

const BOOK = 'a'.repeat(24)
const line = (overrides = {}) => ({
    bookId: BOOK,
    title: 'Babička',
    authorName: 'Božena Němcová',
    image: null,
    unitPrice: 19900,
    quantity: 1,
    lineTotal: 19900,
    available: true,
    unavailableReason: null,
    ...overrides,
})
const quote = {
    currency: 'CZK',
    itemsTotal: 19900,
    shipping: 9900,
    vatIncluded: true,
    vatAmount: 0,
    total: 29800,
    freeShippingThreshold: 100000,
}
const ADDRESS = {
    fullName: 'Jan Novák',
    line1: 'Vodičkova 12',
    city: 'Praha',
    postalCode: '110 00',
    phone: '+420 777 123 456',
}
const order = { id: 'o1', orderNumber: 'ORD-20261015-000001' }
const failure = (code, extra = {}) => Object.assign(new Error(code), { code, ...extra })

let app
let cart
let router

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
    vi.clearAllMocks()
    // clearAllMocks keeps queued mockResolvedValueOnce answers; a test must not inherit them
    api.create.mockReset()
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

async function mount(state = { status: 'ready', lines: [line()], quote }) {
    cart.$patch(state)
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    await router.push('/checkout')
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(CheckoutView) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

const input = (field) => document.getElementById(`checkout-${field}`)
const submitButton = () =>
    [...document.querySelectorAll('button')].find((button) => button.textContent.includes(t('checkout.submit')))

async function fill(address = ADDRESS) {
    for (const [field, value] of Object.entries(address)) {
        input(field).value = value
        input(field).dispatchEvent(new Event('input'))
    }
    await nextTick()
}

async function submit() {
    submitButton().click()
    await vi.waitFor(() => expect(submitButton().disabled).toBe(false))
    await nextTick()
}

const sentKey = (n) => api.create.mock.calls[n][1]
const buttonWith = (label) =>
    [...document.querySelectorAll('button')].find((button) => button.textContent.includes(label))

describe('CheckoutView', () => {
    it('labels the order button with the obligation to pay and disables it while sending', async () => {
        let finish
        api.create.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
        await mount()
        await fill()

        submitButton().click()
        await nextTick()

        expect(submitButton().textContent).toContain('Objednat s povinností platby')
        expect(submitButton().disabled).toBe(true)
        finish({ order, replayed: false })
        // Let the order finish here, or its cart reload lands in the next test
        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('OrderDetails'))
    })

    it('shows every problem of an empty form at its field and in a focused summary, without sending', async () => {
        await mount()

        await submit()

        const summary = document.querySelector('.checkout-errors')
        expect(document.activeElement).toBe(summary)
        expect(summary.querySelector('a[href="#checkout-fullName"]')).not.toBeNull()
        expect(input('fullName').getAttribute('aria-invalid')).toBe('true')
        const describedBy = document.getElementById(input('fullName').getAttribute('aria-describedby'))
        expect(describedBy.textContent).toContain(t('checkout.fieldErrors.required'))
        expect(api.create).not.toHaveBeenCalled()
    })

    it('orders the cart at the server total and opens the order', async () => {
        api.create.mockResolvedValueOnce({ order, replayed: false })
        await mount()
        await fill()

        await submit()

        expect(api.create).toHaveBeenCalledWith(
            { shippingAddress: { ...ADDRESS, country: 'CZ' }, expectedTotal: 29800 },
            expect.any(String)
        )
        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('OrderDetails'))
        expect(router.currentRoute.value.params.id).toBe('o1')
    })

    it('asks before ordering at a changed total, then orders with the same key', async () => {
        const changed = { ...quote, itemsTotal: 20900, total: 30800 }
        api.create
            .mockRejectedValueOnce(failure('PRICE_CHANGED', { details: { quote: changed } }))
            .mockResolvedValueOnce({ order, replayed: false })
        await mount()
        await fill()

        await submit()
        await vi.waitFor(() => expect(document.body.textContent).toContain(t('checkout.priceChanged.title')))
        expect(document.body.textContent).toContain(formatMoney(30800))
        const confirm = [...document.querySelectorAll('button')].find((button) =>
            button.textContent.includes(t('checkout.priceChanged.confirm'))
        )
        confirm.click()

        await vi.waitFor(() => expect(api.create).toHaveBeenCalledTimes(2))
        expect(api.create.mock.calls[1][0].expectedTotal).toBe(30800)
        expect(sentKey(1)).toBe(sentKey(0))
        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('OrderDetails'))
    })

    it('sends the customer back to the cart when a book became unavailable', async () => {
        api.create.mockRejectedValueOnce(failure('CART_HAS_UNAVAILABLE_ITEMS'))
        await mount()
        await fill()

        await submit()

        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('Cart'))
    })

    it('offers a retry after a lost connection that repeats the same request', async () => {
        api.create.mockRejectedValueOnce(failure('NETWORK_ERROR')).mockResolvedValueOnce({ order, replayed: true })
        await mount()
        await fill()

        await submit()
        expect(document.body.textContent).toContain(t('checkout.networkError'))
        const retry = [...document.querySelectorAll('button')].find((button) =>
            button.textContent.includes(t('errors.retry'))
        )
        retry.click()

        await vi.waitFor(() => expect(api.create).toHaveBeenCalledTimes(2))
        expect(api.create.mock.calls[1]).toEqual(api.create.mock.calls[0])
        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('OrderDetails'))
    })

    it('shows a field the server rejected at that field', async () => {
        api.create.mockRejectedValueOnce(
            failure('VALIDATION_FAILED', { fields: { 'shippingAddress.postalCode': 'invalid_format' } })
        )
        await mount()
        await fill()

        await submit()

        await vi.waitFor(() => expect(input('postalCode').getAttribute('aria-invalid')).toBe('true'))
        const describedBy = document.getElementById(input('postalCode').getAttribute('aria-describedby'))
        expect(describedBy.textContent).toContain(t('checkout.fieldFormats.postalCode'))
    })

    it('says there is nothing to order in an empty cart and links to the catalogue', async () => {
        await mount({ status: 'ready', lines: [], quote: null })

        expect(document.body.textContent).toContain(t('checkout.empty'))
        expect(document.querySelector('a[href="/books"]')).not.toBeNull()
        expect(submitButton()).toBeUndefined()
    })

    it('never retries with an address other than the one on screen', async () => {
        api.create.mockRejectedValueOnce(failure('NETWORK_ERROR')).mockResolvedValueOnce({ order, replayed: false })
        await mount()
        await fill()
        await submit()
        expect(buttonWith(t('errors.retry'))).toBeDefined()

        input('line1').value = 'Vodičkova 14'
        input('line1').dispatchEvent(new Event('input'))
        await nextTick()

        expect(buttonWith(t('errors.retry'))).toBeUndefined()
        await submit()
        expect(api.create.mock.calls[1][0].shippingAddress.line1).toBe('Vodičkova 14')
        expect(sentKey(1)).toBe(sentKey(0))
        await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('OrderDetails'))
    })

    it('reloads the cart when the total changed, so the summary shows the new prices', async () => {
        api.create.mockRejectedValueOnce(failure('PRICE_CHANGED', { details: { quote: { ...quote, total: 30800 } } }))
        await mount()
        await fill()
        const loadsBefore = cart.load.mock.calls.length

        await submit()

        await vi.waitFor(() => expect(cart.load).toHaveBeenCalledTimes(loadsBefore + 1))
    })

    it('shows an error when the server rejects a request that has no address field to point at', async () => {
        api.create.mockRejectedValueOnce(failure('VALIDATION_FAILED', { fields: { 'Idempotency-Key': 'required' } }))
        await mount()
        await fill()

        await submit()

        expect(document.body.textContent).toContain(t('errors.VALIDATION_FAILED'))
    })

    it('marks every field as required', async () => {
        await mount()

        expect(document.body.textContent).toContain(t('checkout.requiredNote'))
        for (const field of Object.keys(ADDRESS)) {
            expect(input(field).getAttribute('aria-required')).toBe('true')
        }
    })

    it('moves the focus from the error summary into the field, and does not re-announce the summary', async () => {
        await mount()
        await submit()
        const summary = document.querySelector('.checkout-errors')

        summary.querySelector('a[href="#checkout-city"]').click()

        expect(document.activeElement).toBe(input('city'))
        expect(summary.getAttribute('role')).not.toBe('alert')
    })

    it('names the price dialog and gives the focus back to the order button when it is dismissed', async () => {
        api.create.mockRejectedValueOnce(failure('PRICE_CHANGED', { details: { quote: { ...quote, total: 30800 } } }))
        await mount()
        await fill()
        await submit()
        await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).not.toBeNull())

        const dialog = document.querySelector('[role="dialog"]')
        expect(document.getElementById(dialog.getAttribute('aria-labelledby')).textContent).toContain(
            t('checkout.priceChanged.title')
        )
        buttonWith(t('checkout.priceChanged.cancel')).click()

        await vi.waitFor(() => expect(document.activeElement).toBe(submitButton()))
    })

    it('blocks the order while a book is unavailable and links to the cart', async () => {
        await mount({
            status: 'ready',
            lines: [line({ available: false, unavailableReason: 'OUT_OF_STOCK', lineTotal: 0 })],
            quote: { ...quote, itemsTotal: 0, shipping: 0, total: 0 },
        })

        expect(document.body.textContent).toContain(t('errors.CART_HAS_UNAVAILABLE_ITEMS'))
        expect(document.querySelector('a[href="/cart"]')).not.toBeNull()
        expect(submitButton().disabled).toBe(true)
    })
})
