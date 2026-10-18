import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { cs as vuetifyCs, en as vuetifyEn } from 'vuetify/locale'
import { SEEDED } from './credentials.js'
import { contrastOf, signIn, wcagViolations } from './support.js'

// The admin area's own layout: one header, one navigation, one main with the section heading, nothing of the
// storefront around it
const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}
// Vuetify's own texts: the table footer
const vuetifyWords = { cs: vuetifyCs, en: vuetifyEn }

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

    test(`${locale}: the books table pages, keeps the page on reload and on Back`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        const rows = page.locator('main tbody tr')
        await expect(rows).toHaveCount(10)
        const firstTitle = async () => (await rows.first().locator('td').nth(1).textContent()).trim()
        const pageOne = await firstTitle()

        await page.getByRole('button', { name: vuetifyWords[locale].dataFooter.nextPage }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2')
        await expect.poll(firstTitle).not.toBe(pageOne)
        const pageTwo = await firstTitle()

        await page.reload()
        await expect(rows).toHaveCount(10)
        await expect.poll(firstTitle).toBe(pageTwo)

        await page.goBack()
        await expect(page).toHaveURL((url) => !url.searchParams.has('page'))
        await expect.poll(firstTitle).toBe(pageOne)

        await page.locator('.v-data-table-footer__items-per-page .v-field').click()
        await page.locator('.v-overlay__content .v-list-item').filter({ hasText: /^20$/ }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('limit') === '20')
        await expect(rows).toHaveCount(20)
    })

    test(`${locale}: the admin books page and its form meet the WCAG 2.2 A and AA rules axe checks`, async ({
        page,
    }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)

        expect(await wcagViolations(page, 'body')).toEqual([])

        await page.getByRole('button', { name: words.admin.books.add }).click()
        await expect(page.getByRole('dialog', { name: words.admin.bookForm.createTitle })).toBeVisible()
        expect(await wcagViolations(page, '[role="dialog"]')).toEqual([])
    })

    test(`${locale}: the admin books page reflows at 320 px`, async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 800 })
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)

        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
    })

    test(`${locale}: admin controls are at least 24 by 24 px`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)

        const small = await page
            .locator('main button, main a, main .v-selection-control__input, nav a, header button')
            .evaluateAll((elements) =>
                elements
                    .map((element) => [element, element.getBoundingClientRect()])
                    .filter(([, box]) => box.width > 0 && (box.width < 24 || box.height < 24))
                    .map(([element, box]) => {
                        const name = element.getAttribute('aria-label') ?? element.textContent.trim()
                        return `${name} ${box.width}x${box.height}`
                    })
            )
        expect(small).toEqual([])
    })

    test(`${locale}: the app bar text is readable`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin`)

        const banner = page.getByRole('banner')
        for (const text of [
            banner.getByText(words.nav.admin),
            banner.getByRole('button', { name: 'admin', exact: true }),
        ]) {
            expect(await contrastOf(text)).toBeGreaterThanOrEqual(4.5)
        }
    })
}
