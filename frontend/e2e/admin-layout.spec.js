import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SEEDED } from './credentials.js'
import { signIn } from './support.js'

// The admin area's own layout: one header, one navigation, one main with the section heading, nothing of the
// storefront around it
const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]
    const navigation = (page) => page.getByRole('navigation', { name: words.admin.navLabel })
    const currentItem = (page) => navigation(page).locator('[aria-current="page"]')

    test(`${locale}: the admin area has one header, one main and no storefront chrome`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin`)

        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(words.routes.AdminDashboard)
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(page.getByRole('banner')).toHaveCount(1)
        await expect(page.getByRole('main')).toHaveCount(1)
        await expect(page.getByRole('contentinfo')).toHaveCount(0)
        await expect(page.getByRole('banner')).toContainText(words.nav.admin)
    })

    test(`${locale}: one navigation item is current`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin`)

        await expect(currentItem(page)).toHaveCount(1)
        await expect(currentItem(page)).toContainText(words.routes.AdminDashboard)

        await navigation(page).getByRole('link', { name: words.routes.AdminBooks }).click()

        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin/books`)
        await expect(currentItem(page)).toHaveCount(1)
        await expect(currentItem(page)).toContainText(words.routes.AdminBooks)
    })

    test(`${locale}: on a phone the navigation opens from the menu button`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin`)
        await expect(navigation(page)).toBeHidden()

        await page.getByRole('button', { name: words.nav.openMenu }).click()
        await expect(navigation(page)).toBeVisible()
        await navigation(page).getByRole('link', { name: words.routes.AdminBooks }).click()

        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin/books`)
        await expect(navigation(page)).toBeHidden()
    })

    test(`${locale}: the account menu has no settings, and the settings page is gone`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin`)

        await page.getByRole('banner').getByRole('button', { name: 'admin', exact: true }).click()
        const menu = page.locator('.v-overlay__content')
        await expect(menu).toContainText(words.routes.Profile)
        await expect(menu).toContainText(words.nav.returnStore)
        await expect(menu).toContainText(words.nav.logout)
        await expect(menu.locator('a[href$="/admin/settings"]')).toHaveCount(0)

        await page.goto(`${prefix}/admin/settings`)
        await expect(page.getByRole('heading', { name: words.errors.notFoundTitle })).toBeVisible()
    })
}
