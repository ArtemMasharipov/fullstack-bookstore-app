import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { brokenToken, signIn, signUp } from './support.js'

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
