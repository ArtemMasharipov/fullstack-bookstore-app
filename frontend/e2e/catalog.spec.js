import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { readFileSync } from 'node:fs'
import { BOOKS, SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'
import { contrastOf, seededBook, wcagViolations } from './support.js'

const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}
// Vuetify's own label of the pager, in its cs and en locales
const PAGER = { cs: 'Navigace po stránkách', en: 'Pagination Navigation' }
const OUT_OF_STOCK_TITLE = 'The Fatal Eggs'

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key])
const titlesOf = (page) => page.locator('.book-card__link').allTextContents()
const trimmed = async (page) => (await titlesOf(page)).map((title) => title.trim())
const seedTitles = (category) => BOOKS.filter((b) => !category || b.category === category).map((b) => b.title)
// Newest first: the second page holds the 12 books the seed creates first
const SECOND_PAGE = BOOKS.slice(0, 12)
    .map((b) => b.title)
    .sort()
// The focus ring's inner colour on light surfaces and on navy (design tokens)
const RING = 'rgb(31, 79, 140)'
const RING_ON_NAVY = 'rgb(255, 210, 122)'

const ringOf = (locator) =>
    locator.evaluate((element) => {
        const style = getComputedStyle(element)
        return [style.outlineStyle, style.outlineWidth, style.outlineColor]
    })

// Colours measured in the middle of a fade-in are not the colours people read
const settled = (page) =>
    page.waitForFunction(() => !document.querySelector('[class*="-enter-active"], [class*="-leave-active"]'))

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const other = locale === 'en' ? 'cs' : 'en'
    const otherPrefix = other === 'en' ? '/en' : ''
    const dict = dictionaries[locale]
    const categoryButton = (page, name) =>
        page.getByRole('group', { name: dict.catalog.categories.label }).getByRole('button', { name, exact: true })

    test.describe(`${locale}: catalogue`, () => {
        test(`${locale}: every seeded book is reachable through the pages`, async ({ page }) => {
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            await expect(page.locator('.catalog-range')).toHaveText(
                fill(dict.catalog.range, { from: 1, to: 12, total: 24 })
            )
            const first = await trimmed(page)

            const pager = page.getByRole('navigation', { name: PAGER[locale] })
            await pager.getByRole('button', { name: /\b2$/ }).click()
            await expect(page).toHaveURL(new RegExp(`${prefix}/books\\?page=2$`))
            await expect(page.locator('.catalog-range')).toHaveText(
                fill(dict.catalog.range, { from: 13, to: 24, total: 24 })
            )
            const second = await trimmed(page)

            expect([...first, ...second].sort()).toEqual(seedTitles().sort())
        })

        test(`${locale}: Back returns to the page the visitor came from`, async ({ page }) => {
            await page.goto(`${prefix}/books?page=2`)
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            const titles = await trimmed(page)
            expect([...titles].sort()).toEqual(SECOND_PAGE)

            await page.locator('.book-card__link').first().click()
            await expect(page.getByRole('heading', { level: 1, name: titles[0] })).toBeVisible()
            await page.goBack()

            await expect(page).toHaveURL(new RegExp(`${prefix}/books\\?page=2$`))
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            expect(await trimmed(page)).toEqual(titles)
        })

        test(`${locale}: reload and a language switch keep the page`, async ({ page }) => {
            await page.goto(`${prefix}/books?page=2`)
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            const titles = await trimmed(page)
            expect([...titles].sort()).toEqual(SECOND_PAGE)

            await page.reload()
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            expect(await trimmed(page)).toEqual(titles)

            await page.locator(`header button[lang="${other}"]`).click()
            await expect(page).toHaveURL((url) => url.pathname === `${otherPrefix}/books` && url.search === '?page=2')
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            expect(await trimmed(page)).toEqual(titles)
        })

        test(`${locale}: reload and a language switch keep the search and the category`, async ({ page }) => {
            const otherDict = dictionaries[other]
            const check = async (labels) => {
                await expect(page.locator('.book-card__link')).toHaveText([SMOKE_BOOK_TITLE])
                await expect(page.getByRole('textbox', { name: labels.catalog.search.label })).toHaveValue('Babi')
                await expect(
                    page
                        .getByRole('group', { name: labels.catalog.categories.label })
                        .getByRole('button', { name: 'Fiction', exact: true })
                ).toHaveAttribute('aria-pressed', 'true')
            }

            await page.goto(`${prefix}/books?category=Fiction&q=Babi`)
            await check(dict)
            await page.reload()
            await check(dict)
            await page.locator(`header button[lang="${other}"]`).click()
            await expect(page).toHaveURL(
                (url) => url.pathname === `${otherPrefix}/books` && url.search === '?category=Fiction&q=Babi'
            )
            await check(otherDict)
        })

        test(`${locale}: a category chip on the home page opens the filtered catalogue`, async ({ page }) => {
            await page.goto(`${prefix}/`)
            await page.getByRole('link', { name: 'Science Fiction', exact: true }).click()

            await expect(page).toHaveURL(/category=Science(\+|%20)Fiction/)
            await expect(page.locator('.book-card__link')).toHaveCount(seedTitles('Science Fiction').length)
            expect((await trimmed(page)).sort()).toEqual(seedTitles('Science Fiction').sort())
            await expect(categoryButton(page, 'Science Fiction')).toHaveAttribute('aria-pressed', 'true')
        })

        test(`${locale}: the keyboard opens a book and stops twice on a card`, async ({ page }) => {
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            const link = page.getByRole('link', { name: SMOKE_BOOK_TITLE, exact: true })

            for (let i = 0; i < 80 && !(await link.evaluate((el) => el === document.activeElement)); i++) {
                await page.keyboard.press('Tab')
            }
            await expect(link).toBeFocused()
            await page.keyboard.press('Tab')
            await expect(
                page.getByRole('button', { name: fill(dict.catalog.addToCartNamed, { title: SMOKE_BOOK_TITLE }) })
            ).toBeFocused()
            await page.keyboard.press('Shift+Tab')
            await page.keyboard.press('Enter')

            await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
            await page.goBack()
            const outOfStock = page.locator('.book-card').filter({ hasText: OUT_OF_STOCK_TITLE })
            await expect(outOfStock.locator('a[href], button:not([disabled])')).toHaveCount(1)
        })

        test(`${locale}: the keyboard reaches every card below the first mobile screen`, async ({ page }) => {
            await page.setViewportSize({ width: 390, height: 844 })
            await page.goto(`${prefix}/books`)
            const links = page.locator('.book-card__link')
            await expect(links).toHaveCount(12)
            const titles = await trimmed(page)
            const reached = []
            await links.first().focus()

            // Tab must reveal the real content, including cards initially far below the viewport.
            for (let step = 0; step < 24 && reached.length < 12; step++) {
                const focusedLink = page.locator('.book-card__link:focus')
                if (await focusedLink.count()) {
                    await expect(focusedLink).toBeInViewport()
                    reached.push((await focusedLink.textContent()).trim())
                    const card = page.locator('.book-card:has(.book-card__link:focus)')
                    await expect(card.locator('.book-card__price')).toBeVisible()
                    const cover = await card.locator('.book-cover').boundingBox()
                    expect(cover.height).toBeGreaterThan(100)
                }
                if (reached.length < 12) await page.keyboard.press('Tab')
            }
            expect(reached).toEqual(titles)
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)

            await page.keyboard.press('Enter')
            await expect(page.getByRole('heading', { level: 1, name: titles[11], exact: true })).toBeVisible()
            await page.goBack()
            await expect(links).toHaveCount(12)
            expect(await trimmed(page)).toEqual(titles)
        })
    })

    test.describe(`${locale}: catalogue accessibility`, () => {
        test(`${locale}: no text on the catalogue pages falls below the contrast minimum`, async ({
            page,
            request,
        }) => {
            const book = await seededBook(request)
            const pages = [
                [`${prefix}/`, '.book-card'],
                [`${prefix}/books`, '.book-card'],
                [`${prefix}/books/${book.id}`, '.book-details__price'],
            ]
            for (const [path, ready] of pages) {
                await page.goto(path)
                await expect(page.locator(ready).first()).toBeVisible()
                await settled(page)
                const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
                expect(
                    violations.flatMap((rule) => rule.nodes.map((node) => node.target.join(' '))),
                    path
                ).toEqual([])
            }

            // What axe leaves as "incomplete" (text on buttons and tinted chips) is measured
            const measured = async (name, locator) =>
                expect(await contrastOf(locator), name).toBeGreaterThanOrEqual(4.5)
            await page.goto(`${prefix}/`)
            await expect(page.locator('.book-card').first()).toBeVisible()
            await measured('call to action', page.locator('.hero-cta .v-btn__content'))
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)
            const inStock = page.locator('.book-card').filter({ hasText: SMOKE_BOOK_TITLE })
            const outOfStock = page.locator('.book-card').filter({ hasText: OUT_OF_STOCK_TITLE })
            await measured('price', inStock.locator('.book-card__price'))
            await measured('add to cart', inStock.locator('.book-card__add .v-btn__content'))
            await measured('in stock', inStock.locator('.v-chip__content'))
            await measured('out of stock', outOfStock.locator('.v-chip__content'))
            await measured('range', page.locator('.catalog-range'))
            await page.goto(`${prefix}/books/${book.id}`)
            await expect(page.locator('.book-details__price')).toBeVisible()
            await measured('book price', page.locator('.book-details__price'))
            await measured('current breadcrumb', page.locator('.v-breadcrumbs-item').last())
        })

        test(`${locale}: the focus ring shows on cards, buttons, the pager and the header`, async ({ page }) => {
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)
            const firstLink = page.locator('.book-card__link').first()
            for (let i = 0; i < 80 && !(await firstLink.evaluate((el) => el === document.activeElement)); i++) {
                await page.keyboard.press('Tab')
            }
            await expect(firstLink).toBeFocused()
            expect(await ringOf(firstLink), 'card link').toEqual(['solid', '3px', RING])
            await page.keyboard.press('Tab')
            expect(await ringOf(page.locator(':focus')), 'add to cart').toEqual(['solid', '3px', RING])

            // After keyboard use, focus() shows the ring as Tab would
            for (const [name, locator, colour] of [
                ['category', categoryButton(page, 'Fiction'), RING],
                ['pager', page.locator('.v-pagination button').last(), RING],
                ['header link', page.locator('header a').first(), RING_ON_NAVY],
            ]) {
                await locator.focus()
                expect(await ringOf(locator), name).toEqual(['solid', '3px', colour])
            }
        })

        test(`${locale}: the catalogue meets the WCAG 2.2 A and AA rules axe checks in its main area`, async ({
            page,
        }) => {
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)

            expect(await wcagViolations(page, 'main')).toEqual([])
        })

        test(`${locale}: the catalogue reflows at 320 px`, async ({ page }) => {
            await page.setViewportSize({ width: 320, height: 800 })
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)

            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
        })

        test(`${locale}: catalogue controls are at least 24 by 24 px`, async ({ page }) => {
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)

            const small = await page.locator('main button, main .book-card__link').evaluateAll((elements) =>
                elements
                    // The title link covers its card through ::after, so the card is its target
                    .map((element) => [element, element.closest('.book-card') ?? element])
                    .map(([element, target]) => [element, target.getBoundingClientRect()])
                    .filter(([, box]) => box.width > 0 && (box.width < 24 || box.height < 24))
                    .map(([element, box]) => `${element.textContent.trim()} ${box.width}x${box.height}`)
            )
            expect(small).toEqual([])
        })

        test(`${locale}: cards in a row line up their prices and buttons`, async ({ page }) => {
            await page.setViewportSize({ width: 1440, height: 900 })
            await page.goto(`${prefix}/books`)
            await expect(page.locator('.book-card')).toHaveCount(12)

            // The first row holds a title of two lines next to titles of one line
            const row = await page.locator('.book-card').evaluateAll((cards) =>
                cards.slice(0, 4).map((card) => {
                    const price = card.querySelector('.book-card__price').getBoundingClientRect()
                    const button = card.querySelector('.book-card__add').getBoundingClientRect()
                    return { price: Math.round(price.top), button: Math.round(button.top), height: button.height }
                })
            )
            expect(new Set(row.map((card) => card.price)).size, JSON.stringify(row)).toBe(1)
            expect(new Set(row.map((card) => card.button)).size, JSON.stringify(row)).toBe(1)
            expect(new Set(row.map((card) => card.height)).size, JSON.stringify(row)).toBe(1)
        })
    })
}
