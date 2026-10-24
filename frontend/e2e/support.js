import AxeBuilder from '@axe-core/playwright'
import { expect } from '@playwright/test'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

// An amount in geller, written the way the app writes it in this language
export const money = (amount, locale = 'cs') =>
    new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount / 100)

// A catalogue price in geller, rounded the way the server rounds it
export const geller = (price) => Math.round(Number((price * 100).toPrecision(12)))

export async function seededBook(request) {
    const payload = await (await request.get('/api/v1/books')).json()
    const book = payload.data.find((b) => b.title === SMOKE_BOOK_TITLE)
    return { id: book.id, price: book.price }
}

export async function fillAddress(page) {
    await page.locator('input[autocomplete="name"]').fill('Jan Novák')
    await page.locator('input[autocomplete="address-line1"]').fill('Vodičkova 12')
    await page.locator('input[autocomplete="address-level2"]').fill('Praha')
    await page.locator('input[autocomplete="postal-code"]').fill('110 00')
    await page.locator('input[autocomplete="tel"]').fill('+420 777 123 456')
}

// The WCAG contrast ratio of an element's text against the first opaque background behind it. axe leaves text on
// Vuetify buttons and gradients as "incomplete", so such text is measured here.
export async function contrastOf(locator) {
    return locator.evaluate((element) => {
        const channels = (value) => value.match(/[\d.]+/g).map(Number)
        const luminance = ([r, g, b]) => {
            const linear = [r, g, b].map((v) =>
                v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4
            )
            return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
        }
        let background = [255, 255, 255]
        for (let node = element; node; node = node.parentElement) {
            const color = channels(getComputedStyle(node).backgroundColor)
            if (color.length === 3 || color[3] > 0) {
                background = color
                break
            }
        }
        const [lighter, darker] = [luminance(channels(getComputedStyle(element).color)), luminance(background)].sort(
            (a, b) => b - a
        )
        return (lighter + 0.05) / (darker + 0.05)
    })
}

// The cumulative layout shift of a cold load of a page with books, in a fresh browser context: the shifts not caused
// by input until the first card shows and 2.5 s after. Each shift lists the nodes that moved, for a failure message.
export async function layoutShift(browser, path, viewport, { apiDelay = 0 } = {}) {
    const context = await browser.newContext({ viewport })
    const page = await context.newPage()
    // A slow API keeps the loading state on screen long enough to be painted, as on a real network
    if (apiDelay)
        await page.route('**/api/v1/books**', async (route) => {
            await new Promise((resolve) => setTimeout(resolve, apiDelay))
            await route.continue()
        })
    await page.addInitScript(() => {
        window.__layoutShifts = []
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.hadRecentInput) continue
                window.__layoutShifts.push({
                    value: entry.value,
                    sources: (entry.sources || []).map((source) => ({
                        node: source.node ? `${source.node.nodeName}.${String(source.node.className)}` : null,
                        from: source.previousRect.y,
                        to: source.currentRect.y,
                    })),
                })
            }
        }).observe({ type: 'layout-shift', buffered: true })
    })
    await page.goto(path)
    await page.locator('.book-card').first().waitFor()
    await page.waitForTimeout(2500)
    const shifts = await page.evaluate(() => window.__layoutShifts)
    await context.close()
    return { cls: shifts.reduce((sum, shift) => sum + shift.value, 0), shifts }
}

// WCAG 2.2 A and AA rule violations inside one part of the page
export async function wcagViolations(page, selector) {
    // Colors measured in the middle of a fade-in are not the colors people read
    await page.waitForFunction(() => !document.querySelector('[class*="-enter-active"], [class*="-leave-active"]'))
    const result = await new AxeBuilder({ page })
        .include(selector)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
    return result.violations.map((rule) => ({
        id: rule.id,
        impact: rule.impact,
        targets: rule.nodes.map((node) => node.target.join(' ')),
        // axe's own explanation, so a failure in CI says what to fix
        why: rule.nodes.map((node) => node.failureSummary),
    }))
}

// A new account, registered through the API; answers its credentials
export async function signUp(page) {
    const stamp = `${Date.now()}${Math.floor(Math.random() * 1000)}`
    const user = { username: `buyer${stamp}`, email: `buyer-${stamp}@example.com`, password: 'Silver meadow 58!' }
    const registered = await page.request.post('/api/v1/auth/register', { data: user })
    expect(registered.status()).toBe(201)
    return user
}

// Signs in through the form: on the sign-in page already open, or on the one of this language; answers the token
export async function signIn(page, user, prefix = '') {
    if (!new URL(page.url()).pathname.endsWith('/login')) await page.goto(`${prefix}/login`)
    await page.locator('input[autocomplete="username"]').fill(user.email)
    await page.locator('input[autocomplete="current-password"]').fill(user.password)
    await page.locator('form button[type="submit"]').click()
    await expect(page).not.toHaveURL((url) => url.pathname.endsWith('/login'))
    return page.evaluate(() => localStorage.getItem('token'))
}

// The same token with a forged signature: it still reads as unexpired, but the API refuses it
export function brokenToken(token) {
    const [header, payload] = token.split('.')
    return `${header}.${payload}.${'A'.repeat(43)}`
}
