import { expect, test as base } from '@playwright/test'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { cs as vuetifyCs, en as vuetifyEn } from 'vuetify/locale'
import { SEEDED } from './credentials.js'
import { signIn } from './support.js'

// Fixture teardown has its own deadline, so a timed-out test still removes its temporary authors.
const test = base.extend({
    authorCleanup: [
        async ({ request }, use) => {
            const created = new Map()
            try {
                await use((id, token) => created.set(id, token))
            } finally {
                for (const [id, token] of created) {
                    const response = await request.delete(`/api/v1/authors/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    expect([204, 404]).toContain(response.status())
                }
                expect((await (await request.get('/api/v1/authors?limit=1')).json()).pagination.total).toBe(5)
            }
        },
        { timeout: 30000 },
    ],
})

// The admin's book forms against the API. These tests change the catalogue, so playwright.config.js runs them in a
// project of their own after every other test: the catalogue tests count the seeded books and look for the newest.
const dictionaries = {
    cs: JSON.parse(readFileSync('src/i18n/locales/cs.json', 'utf8')),
    en: JSON.parse(readFileSync('src/i18n/locales/en.json', 'utf8')),
}

// Tab and arrow keys exercise the actual focus order; no pointer opens or submits these author forms.
async function tabTo(page, target, stops, label) {
    await expect(target).toBeVisible()
    for (let step = 0; step < 100; step++) {
        if (
            await target.evaluate(
                (element) => element === document.activeElement || element.contains(document.activeElement)
            )
        ) {
            stops.push(label)
            return
        }
        await page.keyboard.press('Tab')
    }
    throw new Error(`Keyboard could not reach ${label}`)
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]
    const footer = (locale === 'en' ? vuetifyEn : vuetifyCs).dataFooter

    test(`${locale}: the keyboard creates, replaces and deletes an author through the forms`, async ({
        page,
        authorCleanup,
    }, testInfo) => {
        test.setTimeout(60000)
        const lastName = `Author-${locale}-${Date.now()}`
        const stops = []
        let id
        let token
        try {
            await page.goto(`${prefix}/login`)
            await page.locator('input[autocomplete="username"]').focus()
            await page.keyboard.type(SEEDED.admin.email)
            await page.keyboard.press('Tab')
            await page.keyboard.type(SEEDED.admin.password)
            await page.keyboard.press('Enter')
            await expect(page).not.toHaveURL((url) => url.pathname.endsWith('/login'))
            stops.push('Signed in from the keyboard')
            token = await page.evaluate(() => localStorage.getItem('token'))
            await tabTo(page, page.locator('header button:has(.v-avatar)'), stops, 'Account menu')
            await page.keyboard.press('Enter')
            const adminItem = page.locator('.v-overlay__content .v-list-item').filter({ hasText: words.nav.admin })
            await expect(adminItem).toBeVisible()
            for (let step = 0; step < 8; step++) {
                if (
                    await adminItem.evaluate(
                        (el) => el === document.activeElement || el.contains(document.activeElement)
                    )
                )
                    break
                await page.keyboard.press('ArrowDown')
            }
            await page.keyboard.press('Enter')
            await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin`)
            await tabTo(
                page,
                page
                    .getByRole('navigation', { name: words.admin.navLabel })
                    .getByRole('link', { name: new RegExp(`^${words.routes.AdminAuthors}`) }),
                stops,
                'Authors navigation'
            )
            await page.keyboard.press('Enter')
            await expect(page.getByRole('heading', { level: 1 })).toHaveText(words.routes.AdminAuthors)
            const add = page.getByRole('button', { name: words.admin.authors.add, exact: true })
            await tabTo(page, add, stops, 'Add author')
            await page.keyboard.press('Enter')
            let form = page.getByRole('dialog', { name: words.admin.authorForm.createTitle })
            const fields = {
                firstName: 'E2E',
                lastName,
                birthYear: '1900',
                country: 'Czech Republic',
                website: 'https://example.com',
                bio: 'E2E biography',
            }
            for (const [field, value] of Object.entries(fields)) {
                await tabTo(
                    page,
                    form.getByLabel(words.admin.authorForm[field], { exact: true }),
                    stops,
                    `Create ${field}`
                )
                await page.keyboard.type(value)
            }
            await tabTo(
                page,
                form.getByRole('button', { name: words.admin.form.save, exact: true }),
                stops,
                'Save new author'
            )
            const created = answerOf(page, 'POST', '/authors')
            await page.keyboard.press('Enter')
            const createResponse = await created
            const createPayload = await createResponse.json()
            id = createPayload.data?.id
            if (id) authorCleanup(id, token)
            expect(createResponse.status()).toBe(201)
            expect(createPayload.data).toMatchObject({
                firstName: 'E2E',
                lastName,
                bio: 'E2E biography',
                birthYear: 1900,
                country: 'Czech Republic',
                website: 'https://example.com',
            })
            await expect(form).toBeHidden()
            await expect(add).toBeFocused()

            const search = page.getByLabel(words.admin.authors.search, { exact: true })
            await tabTo(page, search, stops, 'Surname search')
            await page.keyboard.type(lastName.slice(0, 8))
            await expect(page).toHaveURL((url) => url.searchParams.get('q') === lastName.slice(0, 8))
            let row = page.locator('main tbody tr').filter({ hasText: lastName })
            await expect(row).toHaveCount(1)
            await tabTo(
                page,
                row.getByRole('button', {
                    name: fill(words.admin.authors.edit, { name: `E2E ${lastName}` }),
                    exact: true,
                }),
                stops,
                'Edit author'
            )
            await page.keyboard.press('Enter')
            form = page.getByRole('dialog', { name: words.admin.authorForm.editTitle })
            for (const [field, value] of Object.entries({
                firstName: 'Edited',
                birthYear: '',
                country: '',
                website: '',
                bio: '',
            })) {
                await tabTo(
                    page,
                    form.getByLabel(words.admin.authorForm[field], { exact: true }),
                    stops,
                    `Replace ${field}`
                )
                await page.keyboard.press('ControlOrMeta+A')
                await page.keyboard.press('Backspace')
                if (value) await page.keyboard.type(value)
            }
            await tabTo(
                page,
                form.getByRole('button', { name: words.admin.form.save, exact: true }),
                stops,
                'Save replacement'
            )
            const updated = answerOf(page, 'PUT', `/authors/${id}`)
            await page.keyboard.press('Enter')
            expect((await updated).status()).toBe(200)
            await expect(form).toBeHidden()
            const stored = (await (await page.request.get(`/api/v1/authors/${id}`)).json()).data
            expect(stored).toMatchObject({ firstName: 'Edited', lastName, bio: '' })
            for (const field of ['country', 'website', 'birthYear']) expect(stored).not.toHaveProperty(field)

            row = page.locator('main tbody tr').filter({ hasText: `Edited ${lastName}` })
            const remove = row.getByRole('button', {
                name: fill(words.admin.authors.delete, { name: `Edited ${lastName}` }),
                exact: true,
            })
            await tabTo(page, remove, stops, 'Delete author')
            await page.keyboard.press('Enter')
            const confirmation = page.getByRole('dialog', { name: words.admin.authors.deleteTitle })
            await expect(confirmation).toBeVisible()
            await page.keyboard.press('Escape')
            await expect(confirmation).toBeHidden()
            expect((await page.request.get(`/api/v1/authors/${id}`)).status()).toBe(200)
            await expect(remove).toBeFocused()
            stops.push('Escape cancels deletion and restores the row')
            await page.keyboard.press('Enter')
            await tabTo(
                page,
                confirmation.getByRole('button', { name: words.admin.authors.deleteConfirm, exact: true }),
                stops,
                'Confirm deletion'
            )
            const deleted = answerOf(page, 'DELETE', `/authors/${id}`)
            await page.keyboard.press('Enter')
            expect((await deleted).status()).toBe(204)
            expect((await page.request.get(`/api/v1/authors/${id}`)).status()).toBe(404)
            await expect(add).toBeFocused()
            stops.push('Deleted author; focus on Add author')
        } finally {
            mkdirSync(testInfo.outputDir, { recursive: true })
            writeFileSync(testInfo.outputPath(`keyboard-admin-authors-${locale}.txt`), stops.join('\n'))
        }
    })

    test(`${locale}: the authors table pages, reloads, returns and sorts beyond the first page`, async ({
        page,
        authorCleanup,
    }) => {
        const token = await signIn(page, SEEDED.admin, prefix)
        const headers = { Authorization: `Bearer ${token}` }
        for (let index = 0; index < 7; index++) {
            const created = await page.request.post('/api/v1/authors', {
                headers,
                data: { firstName: `Paging ${locale}`, lastName: `Writer ${Date.now()}-${index}` },
            })
            const payload = await created.json()
            if (payload.data?.id) {
                authorCleanup(payload.data.id, token)
            }
            expect(created.status()).toBe(201)
        }
        await page.goto(`${prefix}/admin/authors`)
        const rows = page.locator('main tbody tr')
        await expect(rows).toHaveCount(10)
        const first = await rows.allTextContents()
        await page.getByRole('button', { name: footer.nextPage, exact: true }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2')
        await expect(rows).toHaveCount(2)
        const second = await rows.allTextContents()
        expect(second.every((row) => !first.includes(row))).toBe(true)
        await page.reload()
        await expect(rows).toHaveCount(2)
        expect(await rows.allTextContents()).toEqual(second)
        await page.goBack()
        await expect(rows).toHaveCount(10)
        await page.getByRole('button', { name: footer.nextPage, exact: true }).click()
        await expect(rows).toHaveCount(2)
        await page.getByLabel(words.admin.authors.sort, { exact: true }).focus()
        await page.keyboard.press('Enter')
        await page.getByRole('option', { name: words.admin.authors.sorts.lastNameAsc, exact: true }).click()
        await expect(page).toHaveURL(
            (url) => url.searchParams.get('sortBy') === 'lastName' && !url.searchParams.has('page')
        )
        await expect(rows).toHaveCount(10)
        await page.getByRole('button', { name: footer.nextPage, exact: true }).click()
        await expect(rows).toHaveCount(2)
        await page.getByLabel(footer.itemsPerPageText, { exact: true }).focus()
        await page.keyboard.press('Enter')
        await page.getByRole('option', { name: '20', exact: true }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('limit') === '20' && !url.searchParams.has('page'))
        await expect(rows).toHaveCount(12)
    })

    test(`${locale}: an author with books stays intact and the refusal explains their count`, async ({ page }) => {
        await signIn(page, SEEDED.admin, prefix)
        const authors = (await (await page.request.get('/api/v1/authors?limit=100')).json()).data
        const author = authors.find((entry) => entry.lastName === 'Čapek')
        const before = (await (await page.request.get('/api/v1/books?limit=1')).json()).pagination.total
        await page.goto(`${prefix}/admin/authors`)
        await page
            .getByRole('button', {
                name: fill(words.admin.authors.delete, { name: `${author.firstName} ${author.lastName}` }),
                exact: true,
            })
            .click()
        const response = answerOf(page, 'DELETE', `/authors/${author.id}`)
        await page
            .getByRole('dialog', { name: words.admin.authors.deleteTitle })
            .getByRole('button', { name: words.admin.authors.deleteConfirm, exact: true })
            .click()
        expect((await response).status()).toBe(409)
        expect((await (await response).json()).error.details.books).toBe(author.booksCount)
        await expect(
            page.getByText(fill(words.errors.AUTHOR_HAS_BOOKS, { count: author.booksCount }), { exact: true })
        ).toBeVisible()
        expect((await page.request.get(`/api/v1/authors/${author.id}`)).status()).toBe(200)
        expect((await (await page.request.get('/api/v1/books?limit=1')).json()).pagination.total).toBe(before)
    })
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
