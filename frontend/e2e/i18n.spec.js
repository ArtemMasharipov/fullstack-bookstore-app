import { expect, test } from '@playwright/test'
import { readFileSync, readdirSync } from 'node:fs'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'
import { SEEDED } from './credentials.js'
import { signIn } from './support.js'

const cardFor = (page) => page.locator('.book-card').filter({ hasText: SMOKE_BOOK_TITLE })
const capture = async (page, info, name) => {
    const path = info.outputPath(`${name}.png`)
    await page.screenshot({ path, fullPage: true })
    await info.attach(name, { path, contentType: 'image/png' })
}
const language = (page, locale) => page.locator(`header button[lang="${locale}"]`)
const copy = {
    cs: {
        title: 'Knihy',
        details: 'Detail knihy',
        books: 'Knihy',
        catalogue: 'Katalog knih',
        addToCart: 'Přidat do košíku',
        unknown: 'Něco se pokazilo. Zkuste to později.',
        notFound: 'Stránka nenalezena',
    },
    en: {
        title: 'Books',
        details: 'Book Details',
        books: 'Books',
        catalogue: 'Book catalogue',
        addToCart: 'Add to cart',
        unknown: 'Something went wrong. Please try again later.',
        notFound: 'Page not found',
    },
}
let assets
test.beforeAll(() => {
    // Resolve emitted URLs after the runner has built the preview; discovery also works on a fresh clone.
    assets = Object.fromEntries(
        ['cs', 'en'].map((locale) => {
            const name = readdirSync('../dist/assets').find((name) => new RegExp(`^${locale}-.*\\.json$`).test(name))
            expect(name, `separately emitted ${locale} dictionary`).toBeTruthy()
            return [locale, `/assets/${name}`]
        })
    )
})
for (const initial of ['cs', 'en']) {
    test(`${initial}: direct catalog, Intl price, keyboard switch, cart, reload and history`, async ({
        page,
        request,
    }) => {
        const prefix = initial === 'en' ? '/en' : ''
        const other = initial === 'en' ? 'cs' : 'en'
        const requested = []
        page.on('request', (req) => {
            if (Object.values(assets).includes(new URL(req.url()).pathname)) requested.push(new URL(req.url()).pathname)
        })
        const response = await request.get('/api/v1/books')
        const payload = await response.json()
        const books = payload.data.books || payload.data
        const seeded = books.find((book) => book.title === SMOKE_BOOK_TITLE)
        expect(Number.isFinite(seeded.price)).toBe(true)
        await page.goto(`${prefix}/books`)
        await expect(cardFor(page)).toBeVisible()
        await expect(page).toHaveTitle(`${copy[initial].title} | Bookstore`)
        await expect(page.locator('html')).toHaveAttribute('lang', initial)
        await expect(page.getByRole('banner')).toContainText(copy[initial].books)
        expect(requested).toEqual([assets[initial]])
        // The inactive dictionary must also stay out of executable startup assets.
        const inactive = JSON.parse(readFileSync(`../dist${assets[other]}`, 'utf8').replace(/^\uFEFF/, ''))
        const scripts = readdirSync('../dist/assets').filter((name) => name.endsWith('.js'))
        expect(
            scripts.some((name) => readFileSync(`../dist/assets/${name}`, 'utf8').includes(inactive.footer.description))
        ).toBe(false)
        const price = (locale) =>
            new Intl.NumberFormat(locale === 'cs' ? 'cs-CZ' : 'en-GB', { style: 'currency', currency: 'CZK' }).format(
                seeded.price
            )
        await expect(cardFor(page)).toContainText(price(initial))
        await cardFor(page).getByRole('link', { name: SMOKE_BOOK_TITLE }).click()
        await expect(page).toHaveURL(new RegExp(`${prefix}/books/[a-f0-9]{24}$`))
        const id = new URL(page.url()).pathname.split('/').pop()
        expect(id).toBe(seeded.id || seeded._id)
        await page.goto(`${prefix}/books/${id}?sort=price#description`)
        await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
        await expect(page.locator('main')).toContainText(price(initial))
        await page.getByRole('button', { name: copy[initial].addToCart, exact: true }).click()
        await expect(page.locator('.notification-container .notification-wrapper')).toHaveCount(1)
        const cart = await page.evaluate(() => localStorage.getItem('cart'))
        // The guest cart keeps ids and quantities only; prices come from the server
        expect(JSON.parse(cart)).toEqual([{ bookId: id, quantity: 1 }])
        const before = page.url()
        await language(page, other).focus()
        await language(page, other).press('Enter')
        const switched = `${other === 'en' ? '/en' : ''}/books/${id}?sort=price#description`
        await expect(page).toHaveURL(`http://localhost:4173${switched}`)
        await expect(page).toHaveTitle(`${copy[other].details} | Bookstore`)
        await expect(page.locator('html')).toHaveAttribute('lang', other)
        await expect(language(page, other)).toBeFocused()
        await expect(language(page, other)).toHaveAttribute('aria-pressed', 'true')
        await expect(language(page, initial)).toHaveAttribute('aria-pressed', 'false')
        await expect(page.locator('main')).toContainText(price(other))
        expect(await language(page, other).evaluate((el) => getComputedStyle(el).outlineStyle)).toBe('solid')
        expect(await page.evaluate(() => localStorage.getItem('cart'))).toBe(cart)
        await page.reload()
        // The shell's default lang="cs" can match before bootstrap mounts the router.
        await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', other)
        await expect(page).toHaveURL(`http://localhost:4173${switched}`)
        expect(await page.evaluate(() => localStorage.getItem('cart'))).toBe(cart)
        await page.goBack()
        await expect(page).toHaveURL(before)
        await expect(page.locator('html')).toHaveAttribute('lang', initial)
        await page.goForward()
        await expect(page.locator('html')).toHaveAttribute('lang', other)
        await language(page, initial).focus()
        await language(page, initial).press('Space')
        await expect(page).toHaveURL(before)
        await expect(language(page, initial)).toBeFocused()
        await expect(page.locator('main')).toContainText(price(initial))
        expect(await page.evaluate(() => localStorage.getItem('cart'))).toBe(cart)
        await page.locator(`header a[href="${prefix}/cart"]`).click()
        await expect(page.locator('main')).toContainText(SMOKE_BOOK_TITLE)
    })

    test(`${initial}: guest admin destination and direct 404 retain locale; unknown text is safe`, async ({ page }) => {
        const prefix = initial === 'en' ? '/en' : ''
        await page.goto(`${prefix}/admin?tab=books#inventory`)
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/login`)
        expect(new URL(page.url()).searchParams.get('redirect')).toBe(`${prefix}/admin?tab=books#inventory`)
        expect(await page.evaluate(() => localStorage.getItem('redirectPath'))).toBeNull()
        await page.goto(`${prefix}/unknown/a?x=1#missing`)
        await expect(page.getByRole('heading', { name: copy[initial].notFound, exact: true })).toBeVisible()
        await language(page, initial === 'en' ? 'cs' : 'en').click()
        await expect(page).toHaveURL(`http://localhost:4173${initial === 'en' ? '' : '/en'}/unknown/a?x=1#missing`)
        await page.goto(`${prefix}/error?message=RAW_SECRET&code=UNRECOGNIZED`)
        await expect(page.locator('main')).toContainText(copy[initial].unknown)
        await expect(page.locator('body')).not.toContainText('RAW_SECRET')
        await expect(page.locator('body')).not.toContainText('UNRECOGNIZED')
    })

    test(`${initial}: cold active failure retries with one mounted application`, async ({ page }) => {
        let attempts = 0
        await page.route(`**${assets[initial]}`, (route) => (++attempts === 1 ? route.abort() : route.continue()))
        await page.goto(`${initial === 'en' ? '/en' : ''}/books`)
        const retry = page.getByRole('button', { name: initial === 'en' ? 'Retry' : 'Zkusit znovu', exact: true })
        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page.locator('#app > .v-application')).toHaveCount(0)
        await expect(retry).toBeFocused()
        await retry.press('Enter')
        await expect(cardFor(page)).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', initial)
        await expect(page.locator('#app > .v-application')).toHaveCount(1)
        await expect(page.locator('header button[lang]')).toHaveCount(2)
        expect(attempts).toBe(2)
    })
}

test('inactive dictionary failure keeps URL, language and cart until keyboard retry succeeds', async ({ page }) => {
    let attempts = 0
    await page.route(`**${assets.en}`, (route) => (++attempts === 1 ? route.abort() : route.continue()))
    await page.goto('/books')
    await cardFor(page).getByRole('link', { name: SMOKE_BOOK_TITLE }).click()
    await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
    await page.getByRole('button', { name: copy.cs.addToCart, exact: true }).click()
    await expect(page.locator('.notification-container .notification-wrapper')).toHaveCount(1)
    const cart = await page.evaluate(() => localStorage.getItem('cart'))
    await page.goto(new URL(page.url()).pathname + '?sort=price#description')
    await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
    const before = page.url()
    await language(page, 'en').click()
    await expect(page.getByRole('alert')).toContainText('Jazyk se nepodařilo načíst.')
    await expect(page).toHaveURL(before)
    await expect(page.locator('html')).toHaveAttribute('lang', 'cs')
    await expect(page).toHaveTitle('Detail knihy | Bookstore')
    const retry = page.getByRole('button', { name: 'Zkusit znovu', exact: true })
    await expect(retry).toBeFocused()
    await retry.press('Enter')
    await expect(page).toHaveURL(before.replace('/books/', '/en/books/'))
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    expect(await page.evaluate(() => localStorage.getItem('cart'))).toBe(cart)
    expect(attempts).toBe(2)
})

test('a guest 401 keeps the English page and hides the raw API answer', async ({ page }) => {
    await page.route(
        (url) => url.pathname === '/api/v1/books',
        (route) =>
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'RAW_PRIVATE_RESPONSE' }),
            })
    )
    await page.goto('/en/books')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.en.catalogue)
    await expect(page.locator('main')).toContainText(copy.en.unknown)
    await expect(page).toHaveURL('http://localhost:4173/en/books')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.locator('body')).not.toContainText('RAW_PRIVATE_RESPONSE')
})

for (const locale of ['cs', 'en']) {
    test(`${locale}: raw API error stays hidden and Contact reports demo limitation`, async ({ page }, testInfo) => {
        await page.route(
            (url) => url.pathname === '/api/v1/authors',
            (route) =>
                route.fulfill({
                    status: 418,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'RAW_PRIVATE_RESPONSE', code: 'UNRECOGNIZED' }),
                })
        )
        await page.goto(`${locale === 'en' ? '/en' : ''}/authors`)
        await expect(page.getByRole('alert')).toContainText(copy[locale].unknown)
        await expect(page.locator('body')).not.toContainText('RAW_PRIVATE_RESPONSE')
        await expect(page.locator('body')).not.toContainText('UNRECOGNIZED')
        await page
            .getByRole('button', { name: locale === 'en' ? 'Contact support' : 'Kontaktovat podporu', exact: true })
            .click()
        await expect(page.getByRole('status')).toContainText(
            locale === 'en' ? 'No message has been sent.' : '\u017d\u00e1dn\u00e1 zpr\u00e1va nebyla odesl\u00e1na.'
        )
        await capture(page, testInfo, `${locale}-unknown-error`)
    })
}

test('the seeded admin opens the admin area and switches its language from the admin header', async ({
    page,
}, testInfo) => {
    await signIn(page, SEEDED.admin, '/en')
    await page.goto('/en/admin')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard', exact: true })).toBeVisible()
    const header = page.getByRole('banner')
    await expect(header.locator('button[lang="en"]')).toHaveAttribute('aria-pressed', 'true')
    await capture(page, testInfo, 'en-admin-header')
    await header.locator('button[lang="cs"]').focus()
    await header.locator('button[lang="cs"]').press('Enter')
    await expect(page).toHaveURL('http://localhost:4173/admin')
    await expect(page.getByRole('heading', { level: 1, name: 'Přehled', exact: true })).toBeVisible()
    await expect(header.locator('button[lang="cs"]')).toBeFocused()
    await expect(header.locator('button[lang="cs"]')).toHaveAttribute('aria-pressed', 'true')
    await capture(page, testInfo, 'cs-admin-header')
})

test('narrow public and admin headers keep full language controls visible and fitted', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 375, height: 812 })
    const checkHeader = async (header, locale, name) => {
        const labels = locale === 'en' ? ['Czech', 'English'] : ['\u010ce\u0161tina', 'Angli\u010dtina']
        const bounds = await header.boundingBox()
        await testInfo.attach(`${name}-bounds`, {
            body: JSON.stringify(
                await header.evaluate((el) => ({
                    header: el.getBoundingClientRect().toJSON(),
                    controls: [...el.querySelectorAll('button, a, input')].map((control) => ({
                        text: control.textContent,
                        bounds: control.getBoundingClientRect().toJSON(),
                    })),
                })),
                null,
                2
            ),
            contentType: 'application/json',
        })
        for (const [index, code] of ['cs', 'en'].entries()) {
            const button = header.locator(`button[lang="${code}"]`)
            await expect(button).toBeVisible()
            await expect(button).toHaveText(labels[index])
            const box = await button.boundingBox()
            expect(box.x).toBeGreaterThanOrEqual(Math.max(0, bounds.x))
            expect(box.x + box.width).toBeLessThanOrEqual(Math.min(375, bounds.x + bounds.width))
            expect(box.y).toBeGreaterThanOrEqual(bounds.y)
            expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height)
            expect(
                await button.evaluate((el) => {
                    const r = el.getBoundingClientRect()
                    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
                    return hit === el || el.contains(hit)
                })
            ).toBe(true)
        }
        for (const control of await header.locator('button:visible, a:visible, input:visible').all()) {
            const box = await control.boundingBox()
            expect(box.x).toBeGreaterThanOrEqual(0)
            expect(box.x + box.width).toBeLessThanOrEqual(375)
            expect(box.y).toBeGreaterThanOrEqual(bounds.y)
            expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height)
            expect(
                await control.evaluate((el) => {
                    const r = el.getBoundingClientRect()
                    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)
                    return hit === el || el.contains(hit) || hit?.contains(el)
                })
            ).toBe(true)
        }
        const offset = await page
            .locator('main')
            .last()
            .evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))
        expect(offset).toBeGreaterThanOrEqual(bounds.height)
        await capture(page, testInfo, name)
    }
    await page.goto('/en/books')
    const publicHeader = page.getByRole('banner')
    await checkHeader(publicHeader, 'en', 'en-public-header-375')
    await publicHeader.locator('button[lang="cs"]').click()
    await expect(page).toHaveURL('http://localhost:4173/books')
    await checkHeader(publicHeader, 'cs', 'cs-public-header-375')
    await signIn(page, SEEDED.admin, '/en')
    await page.goto('/en/admin')
    const adminHeader = page.getByRole('banner')
    await expect(adminHeader).toBeVisible()
    await checkHeader(adminHeader, 'en', 'en-admin-header-375')
    await adminHeader.locator('button[lang="cs"]').focus()
    await adminHeader.locator('button[lang="cs"]').press('Enter')
    await expect(page).toHaveURL('http://localhost:4173/admin')
    await checkHeader(adminHeader, 'cs', 'cs-admin-header-375')
    await expect(adminHeader.locator('button[lang="cs"]')).toBeFocused()
})
