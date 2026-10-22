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

        // A new page size on page 2 starts again from page 1 with that size
        await page.locator('.v-data-table-footer__items-per-page .v-field').click()
        await page.locator('.v-overlay__content .v-list-item').filter({ hasText: /^20$/ }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('limit') === '20' && !url.searchParams.has('page'))
        await expect(rows).toHaveCount(20)

        await page.goBack()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2' && !url.searchParams.has('limit'))
        await expect.poll(firstTitle).toBe(pageTwo)

        await page.goBack()
        await expect(page).toHaveURL((url) => !url.searchParams.has('page'))
        await expect.poll(firstTitle).toBe(pageOne)
    })

    test(`${locale}: the books table sorts from the keyboard and Back returns from a search`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books?page=2`)
        const rows = page.locator('main tbody tr')
        await expect(rows).toHaveCount(10)

        const price = page.getByRole('columnheader', { name: words.admin.books.columns.price })
        await price.getByRole('button').focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(
            (url) => url.searchParams.get('sortBy') === 'price' && !url.searchParams.has('page')
        )
        await expect(price).toHaveAttribute('aria-sort', 'ascending')

        await page.goBack()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2')
        await page.getByLabel(words.admin.books.search, { exact: true }).fill('Krakatit')
        await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'Krakatit')
        await expect(rows).toHaveCount(1)

        await page.goBack()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2' && !url.searchParams.has('q'))
        await expect(rows).toHaveCount(10)
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2')
    })

    test(`${locale}: the admin books page and its form meet the WCAG 2.2 A and AA rules axe checks`, async ({
        page,
    }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)

        expect(await wcagViolations(page, 'body')).toEqual([])

        let releaseAuthors
        const authorsPending = new Promise((resolve) => (releaseAuthors = resolve))
        await page.route('**/api/v1/authors?*', async (route) => {
            await authorsPending
            await route.continue()
        })
        try {
            await page.getByRole('button', { name: words.admin.books.add }).click()
            const form = page.getByRole('dialog', { name: words.admin.bookForm.createTitle })
            await expect(form).toBeVisible()
            await expect(form.getByRole('progressbar', { name: words.common.loading, exact: true })).toBeVisible()
            expect(await wcagViolations(page, '[role="dialog"]')).toEqual([])
        } finally {
            releaseAuthors()
        }
        await expect(page.getByRole('dialog').getByRole('button', { name: words.admin.form.save })).toBeEnabled()
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

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]

    test(`${locale}: authors and their form are accessible and fit narrow screens`, async ({ page }, testInfo) => {
        test.setTimeout(60000)
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/authors`)
        await expect(page.locator('main tbody tr')).toHaveCount(5)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(words.routes.AdminAuthors)
        await expect(page.getByLabel(words.admin.authors.search, { exact: true })).toBeVisible()
        await expect(page.getByLabel(words.admin.authors.sort, { exact: true })).toBeVisible()
        expect(await wcagViolations(page, 'body')).toEqual([])
        for (const width of [1280, 1440, 390]) {
            await page.setViewportSize({ width, height: width < 600 ? 844 : 900 })
            await page.evaluate(async () => {
                // Resize updates Vuetify's breakpoint on the next frame; drawer CSS transitions have no Vue class.
                await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
                await Promise.all(
                    document
                        .getAnimations()
                        .filter((animation) => animation.effect.getComputedTiming().iterations !== Infinity)
                        .map((animation) => animation.finished.catch(() => {}))
                )
            })
            await page.waitForFunction(
                () => !document.querySelector('[class*="-enter-active"], [class*="-leave-active"]')
            )
            await page.screenshot({
                path: testInfo.outputPath(`pr-b2--admin-authors-${locale}-${width}.png`),
                fullPage: true,
            })
            await page.getByRole('button', { name: words.admin.authors.add, exact: true }).click()
            const form = page.getByRole('dialog', { name: words.admin.authorForm.createTitle })
            await expect(form).toBeVisible()
            await page.waitForFunction(
                () => !document.querySelector('[class*="-enter-active"], [class*="-leave-active"]')
            )
            if (width === 1280) expect(await wcagViolations(page, '[role="dialog"]')).toEqual([])
            await page.screenshot({
                path: testInfo.outputPath(`pr-b2--admin-author-form-${locale}-${width}.png`),
                fullPage: true,
            })
            await page.keyboard.press('Escape')
            await expect(form).toBeHidden()
        }
        await page.setViewportSize({ width: 320, height: 800 })
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
        const small = await page.locator('main button, main a, nav a, header button').evaluateAll((elements) =>
            elements
                .map((el) => [el, el.getBoundingClientRect()])
                .filter(([, box]) => box.width > 0 && (box.width < 24 || box.height < 24))
                .map(
                    ([el, box]) =>
                        `${el.getAttribute('aria-label') ?? el.textContent.trim()} ${box.width}x${box.height}`
                )
        )
        expect(small).toEqual([])
    })

    test(`${locale}: pending book search stays out of the authors address`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)
        let authorChunks = 0
        await page.route('**/assets/AdminAuthorsView-*.js', async (route) => {
            authorChunks++
            // Keep route.name on Books longer than its search debounce, as on a slow first load.
            await new Promise((resolve) => setTimeout(resolve, 1000))
            await route.continue()
        })
        await page.getByLabel(words.admin.books.search, { exact: true }).fill('pending author navigation')
        await page
            .getByRole('navigation', { name: words.admin.navLabel })
            .getByRole('link', { name: new RegExp(`^${words.routes.AdminAuthors}`) })
            .click()
        await expect.poll(() => authorChunks).toBe(1)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(words.routes.AdminAuthors)
        await page.waitForTimeout(400)
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin/authors` && !url.searchParams.has('q'))
    })

    test(`${locale}: the public author link uses the new id and opens their books`, async ({ page }) => {
        const authors = (await (await page.request.get('/api/v1/authors')).json()).data
        const author = authors.find((entry) => entry.lastName === 'Čapek')
        await page.goto(`${prefix}/authors`)
        await page
            .locator('.author-card')
            .filter({ hasText: `${author.firstName} ${author.lastName}` })
            .click()
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/authors/${author.id}`)
        await expect(page.locator('.book-card')).toHaveCount(author.booksCount)
        await expect(page.locator('.v-breadcrumbs a').first()).toHaveAttribute('href', `${prefix}/authors`)
    })
}
