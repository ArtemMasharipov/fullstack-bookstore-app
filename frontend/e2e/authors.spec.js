import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { AUTHORS as SEEDED_AUTHORS } from '../../backend/scripts/seed-data.js'

const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}
// Vuetify's own label of the pager, in its cs and en locales
const PAGER = { cs: 'Navigace po stránkách', en: 'Pagination Navigation' }

const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key])

// The seed has 5 authors; the list of more than the API's default page of 20 is served in the browser, the way
// GET /authors answers: last-name order, the search on first or last name, then the page
const MANY = [
    ...Array.from({ length: 24 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0')
        return { id: `a-${n}`, firstName: 'Jan', lastName: `Autor ${n}`, bio: '', booksCount: 0 }
    }),
    { id: 'a-25', firstName: 'Vladislav', lastName: 'Vančura', bio: '', booksCount: 0 },
]

async function serveMany(page) {
    await page.route(
        (url) => url.pathname === '/api/v1/authors',
        (route) => {
            const params = new URL(route.request().url()).searchParams
            const pageNumber = Number(params.get('page') ?? 1)
            const limit = Number(params.get('limit') ?? 20)
            const needle = params.get('search')?.toLowerCase()
            const found = needle
                ? MANY.filter((a) => [a.firstName, a.lastName].some((name) => name.toLowerCase().includes(needle)))
                : MANY
            return route.fulfill({
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: found.slice((pageNumber - 1) * limit, pageNumber * limit),
                    pagination: {
                        page: pageNumber,
                        limit,
                        total: found.length,
                        pages: Math.ceil(found.length / limit),
                    },
                }),
            })
        }
    )
}

const names = (page) => page.locator('.author-card .v-card-title').allTextContents()

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const dict = dictionaries[locale]

    test.describe(`${locale}: public authors`, () => {
        test(`${locale}: the keyboard pages through more than 20 authors`, async ({ page }) => {
            await serveMany(page)
            await page.goto(`${prefix}/authors`)
            await expect(page.locator('.author-card')).toHaveCount(12)
            const seen = (await names(page)).map((name) => name.trim())

            const pager = page.getByRole('navigation', { name: PAGER[locale] })
            for (const n of [2, 3]) {
                await pager.getByRole('button', { name: new RegExp(`\\b${n}$`) }).focus()
                await page.keyboard.press('Enter')
                await expect(page).toHaveURL(new RegExp(`${prefix}/authors\\?page=${n}$`))
                await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
                await expect(page.locator('.authors-range')).toHaveText(
                    fill(dict.authors.range, { from: (n - 1) * 12 + 1, to: Math.min(n * 12, 25), total: 25 })
                )
                seen.push(...(await names(page)).map((name) => name.trim()))
            }

            expect(seen).toEqual(MANY.map((a) => `${a.firstName} ${a.lastName}`))
        })

        test(`${locale}: a search finds an author who is not on the first page`, async ({ page }) => {
            await serveMany(page)
            await page.goto(`${prefix}/authors`)
            await expect(page.locator('.author-card')).toHaveCount(12)
            expect(await names(page)).not.toContain('Vladislav Vančura')

            await page.getByLabel(dict.authors.search.label, { exact: true }).fill('Vanč')

            await expect(page).toHaveURL((url) => url.searchParams.get('q') === 'Vanč' && !url.searchParams.has('page'))
            await expect(page.locator('.author-card')).toHaveCount(1)
            await expect(page.locator('.author-card')).toContainText('Vladislav Vančura')
        })

        test(`${locale}: Enter on an author card opens the author`, async ({ page }) => {
            const capek = SEEDED_AUTHORS.find((author) => author.lastName === 'Čapek')
            await page.goto(`${prefix}/authors`)
            const card = page.getByRole('link', { name: new RegExp(`${capek.firstName} ${capek.lastName}`) })

            await card.focus()
            await expect(card).toBeFocused()
            await page.keyboard.press('Enter')

            await expect(page).toHaveURL(new RegExp(`${prefix}/authors/[0-9a-f]{24}$`))
            await expect(page.locator('.v-breadcrumbs a').first()).toHaveAttribute('href', `${prefix}/authors`)
        })
    })
}
