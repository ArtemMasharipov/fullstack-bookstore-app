import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

const words = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}

async function booksOf(request) {
    const payload = await (await request.get('/api/v1/books?limit=100')).json()
    return payload.data.books || payload.data
}

async function expectClosedDrawer(page, drawer) {
    await expect(drawer).toHaveAttribute('inert', '')
    await expect(drawer).not.toBeInViewport()
    await drawer.locator('a').first().focus()
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(false)
    const cdp = await page.context().newCDPSession(page)
    const { root } = await cdp.send('DOM.getDocument')
    const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: 'nav.v-navigation-drawer',
    })
    const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
    expect(nodes[0].ignored).toBe(true)
    await cdp.detach()
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const dict = words[locale]

    test(`${locale}: opening-swipe keeps the moving drawer visible before release`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto(prefix + '/')
        await expect(page.locator('.book-card').first()).toBeVisible()
        const drawer = page.locator('nav.v-navigation-drawer')
        const cdp = await page.context().newCDPSession(page)
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchStart',
            touchPoints: [{ x: 5, y: 240 }],
        })
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 100, y: 240 }],
        })
        await cdp.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [{ x: 185, y: 240 }],
        })
        await expect(page.locator('.v-navigation-drawer__scrim')).toBeVisible()
        await expect(drawer).not.toHaveClass(/v-navigation-drawer--active/)
        await expect(drawer).toBeVisible()
        const movingBox = await drawer.boundingBox()
        expect(movingBox.x).toBeLessThan(0)
        expect(movingBox.x + movingBox.width).toBeGreaterThan(0)
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await expect(drawer).toHaveClass(/v-navigation-drawer--active/)
        const books = drawer.getByRole('link', { name: dict.routes.Books, exact: true })
        await books.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`${prefix}/books$`))
    })

    test(`${locale}: closed-state drawer leaves the page and reopens for navigation`, async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 })
        await page.goto(prefix + '/')
        await expect(page.locator('.book-card').first()).toBeVisible()
        const drawer = page.locator('nav.v-navigation-drawer')
        await expectClosedDrawer(page, drawer)
        await page.getByRole('button', { name: dict.nav.openMenu, exact: true }).click()
        await expect(drawer).toBeVisible()
        await expect(drawer).not.toHaveAttribute('inert')
        const books = drawer.getByRole('link', { name: dict.routes.Books, exact: true })
        await books.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`${prefix}/books$`))
        await expectClosedDrawer(page, drawer)
        await expect(page.locator('.book-card')).toHaveCount(12)
    })

    test(`${locale}: footer navigation has ordinary keyboard links and no severe page axe violations`, async ({
        page,
        request,
    }) => {
        const book = (await booksOf(request)).find((entry) => entry.title === SMOKE_BOOK_TITLE)
        for (const route of ['/', '/books', `/books/${book.id}`]) {
            await page.goto(prefix + route)
            await expect(page.locator('main h1')).toBeVisible()
            const result = await new AxeBuilder({ page }).analyze()
            expect(result.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact))).toEqual([])
        }

        const footer = page.locator('footer')
        await expect(footer.getByRole('navigation', { name: dict.nav.quickLinks, exact: true })).toBeVisible()
        await expect(footer.getByRole('navigation', { name: dict.nav.customerService, exact: true })).toBeVisible()
        const links = footer.getByRole('link')
        await expect(links).toHaveCount(6)
        await links.nth(1).focus()
        await page.keyboard.press('Shift+Tab')
        await expect(links.first()).toBeFocused()
        for (let index = 0; index < 6; index++) {
            await expect(links.nth(index)).toBeFocused()
            if (index < 5) await page.keyboard.press('Tab')
        }
        const catalogue = footer.getByRole('link', { name: dict.routes.Books, exact: true })
        await catalogue.focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(new RegExp(`${prefix}/books$`))
        await expect(page.locator('.book-card')).toHaveCount(12)
    })

    for (const titleKind of ['ordinary', 'long']) {
        test(`${locale}: ${titleKind} book title and purchase actions reflow at 320 px`, async ({ page, request }) => {
            const books = await booksOf(request)
            const book =
                titleKind === 'ordinary'
                    ? books.find((entry) => entry.title === SMOKE_BOOK_TITLE)
                    : [...books].sort((a, b) => b.title.length - a.title.length)[0]
            await page.setViewportSize({ width: 320, height: 844 })
            await page.goto(`${prefix}/books/${book.id}`)
            await expect(page.getByRole('heading', { level: 1, name: book.title, exact: true })).toBeVisible()
            await page.evaluate(() => document.fonts.ready)
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
        })
    }

    test(`${locale}: quantity controls have 24 px targets and retain their lower boundary`, async ({
        page,
        request,
    }) => {
        const book = (await booksOf(request)).find((entry) => entry.title === SMOKE_BOOK_TITLE)
        for (const width of [320, 390, 1280]) {
            await page.setViewportSize({ width, height: 844 })
            await page.goto(`${prefix}/books/${book.id}`)
            const increase = page.getByRole('button', { name: dict.book.increase, exact: true })
            const decrease = page.getByRole('button', { name: dict.book.decrease, exact: true })
            await expect(increase).toBeVisible()
            for (const control of [increase, decrease]) {
                const box = await control.boundingBox()
                expect(box.width).toBeGreaterThanOrEqual(24)
                expect(box.height).toBeGreaterThanOrEqual(24)
            }
            const quantity = page.locator('main [aria-live="polite"]')
            await expect(decrease).toBeDisabled()
            await increase.click()
            await expect(quantity).toHaveText('2')
            await decrease.click()
            await expect(quantity).toHaveText('1')
            await expect(decrease).toBeDisabled()
        }
    })
}
