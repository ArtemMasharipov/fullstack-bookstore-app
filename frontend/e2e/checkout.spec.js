import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'
import { fillAddress, wcagViolations } from './support.js'

const cs = JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8'))
const en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8'))

const czk = (amount) =>
    new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100)

const ORDER_URL = /\/orders\/[0-9a-f]{24}$/
const isOrderPost = (request) => request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/orders'

async function seededBookId(request) {
    const payload = await (await request.get('/api/v1/books')).json()
    const book = (payload.data.books || payload.data).find((b) => b.title === SMOKE_BOOK_TITLE)
    return book.id || book._id
}

// A new account signed in through the login form; answers its token
async function signIn(page) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    const user = { username: `buyer${stamp}`, email: `buyer-${stamp}@example.com`, password: 'Silver meadow 58!' }
    const registered = await page.request.post('/api/v1/auth/register', { data: user })
    expect(registered.status()).toBe(201)
    await page.goto('/login')
    await page.locator('input[autocomplete="username"]').fill(user.email)
    await page.locator('input[autocomplete="current-password"]').fill(user.password)
    await page.locator('form button[type="submit"]').click()
    await expect(page).not.toHaveURL(/\/login$/)
    return page.evaluate(() => localStorage.getItem('token'))
}

// Puts one copy of the seeded book in the server cart; answers the cart quote
async function cartWithBook(page, token) {
    const bookId = await seededBookId(page.request)
    const response = await page.request.post('/api/v1/cart', {
        data: { bookId, quantity: 1 },
        headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.ok()).toBe(true)
    return (await response.json()).data.quote
}

async function readyCheckout(page, path = '/checkout') {
    const token = await signIn(page)
    const quote = await cartWithBook(page, token)
    await page.goto(path)
    await expect(page.locator('input[autocomplete="name"]')).toBeVisible()
    return { token, quote }
}

function orderKeys(page) {
    const keys = []
    page.on('request', (request) => {
        if (isOrderPost(request)) keys.push(request.headers()['idempotency-key'])
    })
    return keys
}

test.describe('checkout and orders', () => {
    test('a signed-in user orders, sees the order and cancels it', async ({ page }) => {
        const { quote } = await readyCheckout(page)
        await expect(page.locator('.checkout-summary')).toContainText(czk(quote.total))

        await fillAddress(page)
        await page.getByRole('button', { name: cs.checkout.submit }).click()

        await expect(page).toHaveURL(ORDER_URL)
        const heading = page.getByRole('heading', { level: 1 })
        await expect(heading).toHaveText(/ORD-\d{8}-\d{6}/)
        const orderNumber = (await heading.textContent()).match(/ORD-\d{8}-\d{6}/)[0]
        await expect(page.locator('.order-quote')).toContainText(czk(quote.total))
        await expect(page.getByText(cs.orders.payment.unpaid, { exact: true })).toBeVisible()
        await expect(page.locator('header .v-badge__badge')).toHaveCount(0)

        await page.goto('/orders')
        await page.getByRole('link', { name: orderNumber }).click()
        await expect(page).toHaveURL(ORDER_URL)
        await page.getByRole('button', { name: cs.orders.cancel }).click()
        await page.getByRole('button', { name: cs.orders.cancelConfirm }).click()

        await expect(page.getByText(cs.orders.status.cancelled, { exact: true }).first()).toBeVisible()
        await expect(page.getByRole('button', { name: cs.orders.cancel })).toHaveCount(0)
    })

    test('a double click places one order', async ({ page }) => {
        const { token } = await readyCheckout(page)
        await fillAddress(page)

        await page.getByRole('button', { name: cs.checkout.submit }).dblclick()

        await expect(page).toHaveURL(ORDER_URL)
        const orders = await page.request.get('/api/v1/orders', { headers: { Authorization: `Bearer ${token}` } })
        expect((await orders.json()).pagination.total).toBe(1)
    })

    test('a lost connection is retried with the same key', async ({ page }) => {
        await readyCheckout(page)
        const keys = orderKeys(page)
        await page.route('**/api/v1/orders', (route) => route.abort(), { times: 1 })
        await fillAddress(page)

        await page.getByRole('button', { name: cs.checkout.submit }).click()
        await expect(page.getByText(cs.checkout.networkError)).toBeVisible()
        await page.getByRole('button', { name: cs.errors.retry }).click()

        await expect(page).toHaveURL(ORDER_URL)
        expect(keys).toHaveLength(2)
        expect(keys[1]).toBe(keys[0])
    })

    test('a changed price asks before ordering', async ({ page }) => {
        const { quote } = await readyCheckout(page)
        const keys = orderKeys(page)
        // The quote of an order error carries no free shipping threshold
        const changed = { ...quote }
        delete changed.freeShippingThreshold
        await page.route(
            '**/api/v1/orders',
            (route) =>
                route.fulfill({
                    status: 409,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: { code: 'PRICE_CHANGED', message: 'The total has changed', details: { quote: changed } },
                    }),
                }),
            { times: 1 }
        )
        await fillAddress(page)

        await page.getByRole('button', { name: cs.checkout.submit }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toContainText(cs.checkout.priceChanged.title)
        await expect(dialog).toContainText(czk(quote.total))
        await dialog.getByRole('button', { name: cs.checkout.priceChanged.confirm }).click()

        await expect(page).toHaveURL(ORDER_URL)
        expect(keys).toHaveLength(2)
        expect(keys[1]).toBe(keys[0])
    })

    test('an unavailable book sends the user back to the cart', async ({ page }) => {
        await readyCheckout(page)
        await page.route(
            '**/api/v1/orders',
            (route) =>
                route.fulfill({
                    status: 422,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        success: false,
                        error: { code: 'CART_HAS_UNAVAILABLE_ITEMS', message: 'Cart has unavailable items' },
                    }),
                }),
            { times: 1 }
        )
        await fillAddress(page)

        await page.getByRole('button', { name: cs.checkout.submit }).click()

        await expect(page).toHaveURL(/\/cart$/)
    })

    test('checkout shows an error with retry when the API is down', async ({ page }) => {
        const token = await signIn(page)
        await cartWithBook(page, token)
        await page.route('**/api/v1/cart', (route) => route.abort())

        await page.goto('/checkout')
        // Vuetify marks loading skeletons as alerts too: take the one with the retry
        const alert = page.getByRole('alert').filter({ has: page.getByRole('button', { name: cs.errors.retry }) })
        await expect(alert).toBeVisible()
        await page.unroute('**/api/v1/cart')
        await alert.getByRole('button', { name: cs.errors.retry }).click()

        await expect(page.locator('input[autocomplete="name"]')).toBeVisible()
    })

    test('checkout fits 320 px', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 })
        await readyCheckout(page)

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow).toBeLessThanOrEqual(0)
    })

    test('checkout, the order and the order list meet WCAG 2.2 AA', async ({ page }) => {
        await readyCheckout(page)

        await page.getByRole('button', { name: cs.checkout.submit }).click()
        await expect(page.locator('.checkout-errors')).toBeFocused()
        expect(await wcagViolations(page, 'main'), 'checkout with the error summary').toEqual([])

        await fillAddress(page)
        expect(await wcagViolations(page, 'main'), 'checkout filled in').toEqual([])
        await page.getByRole('button', { name: cs.checkout.submit }).click()
        await expect(page).toHaveURL(ORDER_URL)
        await expect(page.locator('.order-quote')).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'order details').toEqual([])

        await page.getByRole('button', { name: cs.orders.cancel }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        expect(await wcagViolations(page, '[role="dialog"]'), 'cancel dialog').toEqual([])
        await page.getByRole('button', { name: cs.orders.keep }).click()

        await page.goto('/orders')
        await expect(page.locator('.order-row')).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'order list').toEqual([])
    })

    test('English checkout', async ({ page }) => {
        await readyCheckout(page, '/en/checkout')
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await fillAddress(page)

        await page.getByRole('button', { name: en.checkout.submit }).click()

        await expect(page).toHaveURL(/\/en\/orders\/[0-9a-f]{24}$/)
        await expect(page.getByText(en.orders.payment.unpaid, { exact: true })).toBeVisible()
    })
})
