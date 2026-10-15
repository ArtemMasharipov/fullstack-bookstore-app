import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

const cs = JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8'))
const en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8'))
const named = (message, title) => message.replace('{title}', title)

const SHIPPING_FEE = 9900
const geller = (price) => Math.round(Number((price * 100).toPrecision(12)))
const czk = (amount) =>
    new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100)

async function seededBook(request) {
    const payload = await (await request.get('/api/v1/books')).json()
    const book = (payload.data.books || payload.data).find((b) => b.title === SMOKE_BOOK_TITLE)
    return { id: book.id || book._id, price: book.price }
}

// A guest cart with one copy of the book, as the app stores it
async function guestCartWith(page, bookId) {
    await page.goto('/')
    await page.evaluate((id) => localStorage.setItem('cart', JSON.stringify([{ bookId: id, quantity: 1 }])), bookId)
}

test.describe('server cart', () => {
    test('guest adds a book, sees the server total and keeps the cart after signing in', async ({ page, request }) => {
        const book = await seededBook(request)

        await page.goto(`/books/${book.id}`)
        await page.getByRole('button', { name: 'Add to Cart', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Added!', exact: true })).toBeVisible()
        await expect(page.locator('.notification-container .notification-wrapper')).toHaveCount(1)

        await page.goto('/cart')
        const total = czk(geller(book.price) + SHIPPING_FEE)
        await expect(page.locator('.cart-summary')).toContainText(total)

        const stamp = Date.now()
        const user = { username: `cart${stamp}`, email: `cart-${stamp}@example.com`, password: 'secret123' }
        const registered = await page.request.post('/api/v1/auth/register', { data: user })
        expect(registered.status()).toBe(201)
        await page.goto('/login')
        await page.locator('input[autocomplete="username"]').fill(user.email)
        await page.locator('input[autocomplete="current-password"]').fill(user.password)
        await page.locator('form button[type="submit"]').click()
        await expect(page).not.toHaveURL(/\/login$/)

        await expect(page.locator('header .v-badge__badge')).toHaveText('1')
        expect(await page.evaluate(() => localStorage.getItem('cart'))).toBeNull()
        await page.goto('/cart')
        await expect(page.locator('.cart-line')).toContainText(SMOKE_BOOK_TITLE)

        const increase = page.getByRole('button', { name: named(cs.cart.increase, SMOKE_BOOK_TITLE) })
        const decrease = page.getByRole('button', { name: named(cs.cart.decrease, SMOKE_BOOK_TITLE) })
        await increase.click()
        await expect(page.locator('.cart-line__quantity')).toHaveText('2')
        await expect(page.locator('.cart-summary')).toContainText(czk(2 * geller(book.price) + SHIPPING_FEE))

        for (const [width, minimum] of [
            [1280, 24],
            [390, 44],
        ]) {
            await page.setViewportSize({ width, height: 900 })
            for (const button of [increase, decrease]) {
                const box = await button.boundingBox()
                expect(box.width, `${width}px`).toBeGreaterThanOrEqual(minimum)
                expect(box.height, `${width}px`).toBeGreaterThanOrEqual(minimum)
            }
        }
    })

    test('guest cart shows an error with a retry when the quote fails', async ({ page, request }) => {
        const book = await seededBook(request)
        await guestCartWith(page, book.id)
        await page.route('**/api/v1/cart/quote', (route) => route.abort())

        await page.goto('/cart')
        // Vuetify marks loading skeletons as alerts too: take the one with the retry
        const alert = page.getByRole('alert').filter({ has: page.getByRole('button', { name: cs.errors.retry }) })
        await expect(alert).toBeVisible()

        await page.unroute('**/api/v1/cart/quote')
        await alert.getByRole('button', { name: cs.errors.retry }).click()
        await expect(page.locator('.cart-line')).toContainText(SMOKE_BOOK_TITLE)
    })

    test('keyboard user keeps the focus on the quantity button between changes', async ({ page, request }) => {
        const book = await seededBook(request)
        await guestCartWith(page, book.id)
        await page.goto('/cart')
        const increase = page.getByRole('button', { name: named(cs.cart.increase, SMOKE_BOOK_TITLE) })
        const quantity = page.locator('.cart-line__quantity')

        await increase.focus()
        await page.keyboard.press('Enter')
        await expect(quantity).toHaveText('2')
        await expect(increase).toBeFocused()
        await page.keyboard.press('Enter')

        await expect(quantity).toHaveText('3')
        await expect(increase).toBeFocused()
    })

    test('cart fits a 320 px screen without horizontal scrolling', async ({ page, request }) => {
        const book = await seededBook(request)
        await page.setViewportSize({ width: 320, height: 800 })
        await guestCartWith(page, book.id)

        await page.goto('/cart')
        await expect(page.locator('.cart-line')).toBeVisible()

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        expect(overflow).toBeLessThanOrEqual(0)
    })

    test('English cart keeps the English locale in its links', async ({ page, request }) => {
        const book = await seededBook(request)
        await guestCartWith(page, book.id)

        await page.goto('/en/cart')

        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(en.cart.title)
        await expect(page.getByRole('link', { name: en.cart.continueShopping })).toHaveAttribute('href', '/en/books')
        await expect(page.locator('.cart-line')).toContainText(SMOKE_BOOK_TITLE)
    })
})
