import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SEEDED } from './credentials.js'
import { signIn, signUp } from './support.js'

// Access to the admin area by the role the API has for the user, and sessions
// that end on the server: signing out and losing the admin role
const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}
const dict = dictionaries.en

// A well-formed id that no order has
const MISSING_ORDER = '5f0c9a1b2c3d4e5f6a7b8c9d'

const accountMenu = (page) => page.locator('header button:has(.v-avatar)')
const menuItem = (page, text) => page.locator('.v-overlay__content .v-list-item').filter({ hasText: text })

async function apiToken(request, { email, password }) {
    const res = await request.post('/api/v1/auth/login', { data: { emailOrUsername: email, password } })
    expect(res.status()).toBe(200)
    return (await res.json()).data.token
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]

    test(`${locale}: the seeded admin opens the admin area from the account menu`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)

        await accountMenu(page).click()
        await menuItem(page, words.nav.admin).click()

        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin`)
        await expect(page.getByRole('heading', { name: words.nav.admin, exact: true })).toBeVisible()
    })

    test(`${locale}: a customer is refused the admin area`, async ({ page }) => {
        await signIn(page, await signUp(page), prefix)

        await accountMenu(page).click()
        await expect(menuItem(page, words.routes.Orders)).toBeVisible()
        await expect(menuItem(page, words.nav.admin)).toHaveCount(0)
        await page.keyboard.press('Escape')

        await page.goto(`${prefix}/admin`)
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/unauthorized`)
    })
}

test('a guest asking for the admin area signs in and returns there', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL((url) => url.pathname === '/login' && url.searchParams.get('redirect') === '/admin')

    await signIn(page, SEEDED.admin)

    await expect(page).toHaveURL((url) => url.pathname === '/admin')
})

test('a customer on an order status link sees no status form', async ({ page }) => {
    await signIn(page, await signUp(page), '/en')

    await page.goto(`/en/orders/${MISSING_ORDER}/status`)

    await expect(page).toHaveURL((url) => url.pathname === `/en/orders/${MISSING_ORDER}`)
    await expect(page.getByText(dict.orders.notFound)).toBeVisible()
    await expect(page.getByRole('radiogroup')).toHaveCount(0)
})

test('signing out ends the session on the server', async ({ page }) => {
    const token = await signIn(page, await signUp(page), '/en')

    const told = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/v1/auth/logout')
    await accountMenu(page).click()
    await menuItem(page, dict.nav.logout).click()
    expect((await told).status()).toBe(204)

    const me = await page.request.get('/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })
    expect(me.status()).toBe(401)
})

test('an admin whose role is taken away is sent to sign in at the next request', async ({ page }) => {
    // A second admin, made by the seeded one through the API
    const seededToken = await apiToken(page.request, SEEDED.admin)
    const asSeeded = { Authorization: `Bearer ${seededToken}` }
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    const second = { username: `admin${stamp}`, email: `admin-${stamp}@example.com`, password: 'second-admin-pass' }
    const created = await page.request.post('/api/v1/users', { headers: asSeeded, data: { ...second, role: 'admin' } })
    expect(created.status()).toBe(201)
    const secondId = (await created.json()).data.id

    await signIn(page, second, '/en')
    await page.goto('/en/admin/books')
    await expect(page.getByRole('heading', { name: dict.nav.admin, exact: true })).toBeVisible()

    const demoted = await page.request.put(`/api/v1/users/${secondId}`, { headers: asSeeded, data: { role: 'user' } })
    expect(demoted.status()).toBe(200)

    // The dashboard asks the API for the orders: the ended session answers 401
    await page.locator('.admin-sidebar a').filter({ hasText: dict.routes.AdminDashboard }).click()
    await expect(page).toHaveURL((url) => url.pathname === '/en/login')
})
