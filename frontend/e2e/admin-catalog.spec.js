import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { SEEDED } from './credentials.js'
import { signIn } from './support.js'

// The admin's book forms against the API. These tests change the catalogue, so playwright.config.js runs them in a
// project of their own after every other test: the catalogue tests count the seeded books and look for the newest.
const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}
const fill = (text, values) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text)

// The answer of the next request with this method to this API path
const answerOf = (page, method, path) =>
    page.waitForResponse(
        (response) => response.request().method() === method && new URL(response.url()).pathname === `/api/v1${path}`
    )

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]
    const priceLabel = fill(words.common.priceLabel, { currency: 'CZK' })

    test(`${locale}: the admin adds, edits, stocks and deletes a book through the forms`, async ({ page }) => {
        const title = `E2E ${locale} ${Date.now()}`
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/books`)
        await expect(page.locator('main tbody tr')).toHaveCount(10)

        // Add
        await page.getByRole('button', { name: words.admin.books.add }).click()
        const createForm = page.getByRole('dialog', { name: words.admin.bookForm.createTitle })
        await expect(createForm).toBeVisible()
        await expect(createForm).not.toContainText(/ISBN|quantity|množství|počet kusů/i)
        await createForm.getByLabel(words.admin.bookForm.title, { exact: true }).fill(title)
        await createForm.getByLabel(words.admin.bookForm.author, { exact: true }).click()
        await page.getByRole('option', { name: 'Čapek, Karel' }).click()
        await createForm.getByLabel(words.admin.bookForm.year, { exact: true }).fill('1925')
        // From the keyboard: Vuetify lays the selection over the select's input, which takes the pointer
        await createForm.getByLabel(words.admin.bookForm.category, { exact: true }).focus()
        await page.keyboard.press('Enter')
        await page.getByRole('option', { name: 'Fiction', exact: true }).click()
        await createForm.getByLabel(priceLabel, { exact: true }).fill('249.90')
        const created = answerOf(page, 'POST', '/books')
        await createForm.getByRole('button', { name: words.admin.form.save }).click()
        expect((await created).status()).toBe(201)
        const id = (await (await created).json()).data.id
        await expect(page.getByText(fill(words.admin.books.created, { title }))).toBeVisible()

        const stored = async () => (await (await page.request.get(`/api/v1/books/${id}`)).json()).data
        expect(await stored()).toMatchObject({
            title,
            publicationYear: 1925,
            category: 'Fiction',
            price: 249.9,
            inStock: true,
            author: { firstName: 'Karel', lastName: 'Čapek' },
        })

        // Edit
        const row = page.locator('main tbody tr').filter({ hasText: title })
        await row.getByRole('button', { name: fill(words.admin.books.edit, { title }) }).click()
        const editForm = page.getByRole('dialog', { name: words.admin.bookForm.editTitle })
        await expect(editForm.getByLabel(words.admin.bookForm.title, { exact: true })).toHaveValue(title)
        await editForm.getByLabel(priceLabel, { exact: true }).fill('199.90')
        const replaced = answerOf(page, 'PUT', `/books/${id}`)
        await editForm.getByRole('button', { name: words.admin.form.save }).click()
        expect((await replaced).status()).toBe(200)
        await expect(page.getByText(fill(words.admin.books.updated, { title }))).toBeVisible()
        expect((await stored()).price).toBe(199.9)

        // Stock
        const stocked = answerOf(page, 'PATCH', `/books/${id}/stock`)
        await row.getByLabel(fill(words.admin.books.stockToggle, { title })).uncheck()
        expect((await stocked).status()).toBe(200)
        expect((await stored()).inStock).toBe(false)

        // Delete
        await row.getByRole('button', { name: fill(words.admin.books.delete, { title }) }).click()
        const confirmation = page.getByRole('dialog', { name: words.admin.books.deleteTitle })
        await expect(confirmation).toContainText(fill(words.admin.books.deleteMessage, { title }))
        const deleted = answerOf(page, 'DELETE', `/books/${id}`)
        await confirmation.getByRole('button', { name: words.admin.books.deleteConfirm }).click()
        expect((await deleted).status()).toBe(204)
        expect((await page.request.get(`/api/v1/books/${id}`)).status()).toBe(404)
        await expect(page.locator('main tbody tr').filter({ hasText: title })).toHaveCount(0)
    })
}
