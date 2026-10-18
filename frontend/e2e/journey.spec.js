import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fillAddress, geller, money, seededBook, signIn, signUp } from './support.js'

const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}

const SESSION_KEYS = ['token', 'userData', 'cart', 'redirectPath']
const ORDER_PATH = /\/orders\/[0-9a-f]{24}$/

async function shopSettings(request) {
    return (await (await request.get('/api/v1/config/public')).json()).data
}

// The user menu in the header: the button with the user's avatar
async function userMenu(page, item) {
    await page.locator('header button:has(.v-avatar)').click()
    await page.locator('.v-overlay__content .v-list-item').filter({ hasText: item }).click()
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const dict = dictionaries[locale]

    test(`${locale}: a guest signs in, keeps the cart, orders, finds the order and cancels it`, async ({
        page,
        request,
    }) => {
        const book = await seededBook(request)
        const settings = await shopSettings(request)
        const total = money(geller(book.price) + settings.shippingFee, locale)

        await page.goto(`${prefix}/books/${book.id}`)
        await page.getByRole('button', { name: dict.catalog.addToCart, exact: true }).click()
        await expect(page.locator('.notification-container .notification-wrapper')).toHaveCount(1)

        await page.goto(`${prefix}/cart`)
        await expect(page.locator('.cart-summary')).toContainText(total)
        await page.getByRole('link', { name: dict.cart.loginToCheckout }).click()
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/login`)
        expect(new URL(page.url()).searchParams.get('redirect')).toBe(`${prefix}/checkout`)

        await signIn(page, await signUp(page))
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/checkout`)
        await expect(page.locator('header .v-badge__badge')).toHaveText('1')
        expect(await page.evaluate(() => localStorage.getItem('cart'))).toBeNull()
        await expect(page.locator('.checkout-summary')).toContainText(total)

        await fillAddress(page)
        await page.getByRole('button', { name: dict.checkout.submit }).click()
        await expect(page).toHaveURL(ORDER_PATH)
        const heading = page.getByRole('heading', { level: 1 })
        await expect(heading).toHaveText(/ORD-\d{8}-\d{6}/)
        const orderNumber = (await heading.textContent()).match(/ORD-\d{8}-\d{6}/)[0]
        await expect(page.locator('.order-quote')).toContainText(total)

        await userMenu(page, dict.routes.Orders)
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/orders`)
        await page.getByRole('link', { name: orderNumber }).click()
        await expect(page).toHaveURL(ORDER_PATH)
        await page.getByRole('button', { name: dict.orders.cancel }).click()
        await page.getByRole('button', { name: dict.orders.cancelConfirm }).click()
        await expect(page.getByText(dict.orders.status.cancelled, { exact: true }).first()).toBeVisible()

        const told = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/auth/logout')
        await userMenu(page, dict.nav.logout)
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/login`)
        // The server hears about it after the session has ended here
        expect((await told).status()).toBe(200)
        // Signing out leaves no way back to the previous user's order for the next person on this device
        expect(new URL(page.url()).searchParams.get('redirect')).toBeNull()
        // The snackbar shows its text in an overlay outside the container
        await expect(page.locator('.notification-message')).toHaveText([dict.notifications.logoutSuccess])
        await expect(page.locator('header .v-badge__badge')).toHaveCount(0)
        expect(await page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), SESSION_KEYS)).toEqual([
            null,
            null,
            null,
            null,
        ])
    })

    test(`${locale}: the home page, a book and the cart state the shop's own terms`, async ({ page, request }) => {
        const book = await seededBook(request)
        const settings = await shopSettings(request)
        const fee = money(settings.shippingFee, locale)
        const threshold = money(settings.freeShippingThreshold, locale)

        await page.goto(`${prefix}/`)
        await expect(page.locator('.home-terms')).toContainText(fee)
        await expect(page.locator('.home-terms')).toContainText(threshold)
        await expect(page.locator('body')).not.toContainText(/30-day|returns|encryption/i)

        await page.goto(`${prefix}/books/${book.id}`)
        await expect(page.locator('main')).toContainText(dict.shipping.freeFrom.replace('{amount}', threshold))
        await expect(page.locator('body')).not.toContainText(/30-day|returns|encryption/i)

        await page.getByRole('button', { name: dict.catalog.addToCart, exact: true }).click()
        await expect(page.locator('.notification-container .notification-wrapper')).toHaveCount(1)
        await page.goto(`${prefix}/cart`)
        await expect(page.locator('.cart-summary')).toContainText(fee)
        await expect(page.locator('.cart-summary')).toContainText(
            dict.cart.freeShippingFrom.replace('{amount}', threshold)
        )
    })
}
