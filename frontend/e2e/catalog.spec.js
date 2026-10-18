import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { BOOKS, SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

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
            await expect(page).toHaveURL(new RegExp(`${otherPrefix}/books\\?page=2$`))
            await expect(page.locator('.book-card__link')).toHaveCount(12)
            expect(await trimmed(page)).toEqual(titles)
        })

        test(`${locale}: reload and a language switch keep the search and the category`, async ({ page }) => {
            const otherDict = dictionaries[other]
            const check = async (labels) => {
                await expect(page.locator('.book-card__link')).toHaveCount(1)
                expect(await trimmed(page)).toEqual([SMOKE_BOOK_TITLE])
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
            await expect(page).toHaveURL(new RegExp(`${otherPrefix}/books\\?category=Fiction&q=Babi$`))
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
    })
}
