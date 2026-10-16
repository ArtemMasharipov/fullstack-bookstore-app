import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { brokenToken, seededBook, signIn, signUp, wcagViolations } from './support.js'

const en = JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8'))

const SESSION_KEYS = ['token', 'userData', 'cart', 'redirectPath']
const sessionKeys = (page) => page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), SESSION_KEYS)

// A signed-in user whose token the API no longer accepts
async function expiredSession(page) {
    const token = await signIn(page, await signUp(page), '/en')
    await page.evaluate((broken) => localStorage.setItem('token', broken), brokenToken(token))
}

test.describe('session', () => {
    test('a 401 on an English page that needs an account opens /en/login with the way back', async ({ page }) => {
        await expiredSession(page)

        await page.goto('/en/orders')

        await expect(page).toHaveURL((url) => url.pathname === '/en/login')
        expect(new URL(page.url()).searchParams.get('redirect')).toBe('/en/orders')
        await expect(page.locator('html')).toHaveAttribute('lang', 'en')
        expect(await sessionKeys(page)).toEqual([null, null, null, null])
    })

    test('a 401 on a public page keeps the visitor there as a guest', async ({ page }) => {
        await expiredSession(page)

        await page.goto('/en/books')

        await expect(page.locator('header').getByRole('link', { name: en.routes.Login, exact: true })).toBeVisible()
        await expect(page).toHaveURL((url) => url.pathname === '/en/books')
        expect(await sessionKeys(page)).toEqual([null, null, null, null])
    })
})

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''

    test(`${locale}: sign-in and registration meet WCAG 2.2 AA`, async ({ page }) => {
        await page.goto(`${prefix}/login`)
        await expect(page.locator('form button[type="submit"]')).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'sign-in').toEqual([])

        await page.locator('form button[type="submit"]').click()
        await expect(page.locator('.v-messages__message').first()).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'sign-in with field errors').toEqual([])

        await page.goto(`${prefix}/register`)
        await expect(page.locator('form button[type="submit"]')).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'registration').toEqual([])
    })

    test(`${locale}: the home page meets WCAG 2.2 AA`, async ({ page }) => {
        await page.goto(`${prefix}/`)
        await expect(page.locator('.home-terms')).toBeVisible()
        await expect(page.locator('.book-card').first()).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'home').toEqual([])
    })

    test(`${locale}: a book page meets WCAG 2.2 AA`, async ({ page, request }) => {
        const book = await seededBook(request)
        await page.goto(`${prefix}/books/${book.id}`)
        await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeVisible()
        expect(await wcagViolations(page, 'main'), 'book').toEqual([])
    })
}
