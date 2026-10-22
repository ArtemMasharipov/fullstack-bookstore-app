import { expect, test as base } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { SEEDED } from './credentials.js'

export const dictionaries = Object.fromEntries(
    ['cs', 'en'].map((locale) => [locale, JSON.parse(readFileSync(`src/i18n/locales/${locale}.json`, 'utf8'))])
)
export const auth = (token) => ({ Authorization: `Bearer ${token}` })
export async function loginApi(request, credentials) {
    const response = await request.post('/api/v1/auth/login', {
        data: { emailOrUsername: credentials.email, password: credentials.password },
    })
    expect(response.status()).toBe(200)
    return (await response.json()).data
}
// Independent teardown deadline: temporary users are deactivated, not deleted; seed accounts are never changed.
export const test = base.extend({
    adminData: [
        async ({ request }, use) => {
            const session = await loginApi(request, SEEDED.admin),
                headers = auth(session.token),
                users = [],
                orders = []
            const stamp = `pc${Date.now()}${Math.floor(Math.random() * 1000)}`
            async function createUser(suffix = 'buyer') {
                const credentials = {
                    username: `${stamp}_${suffix}`,
                    email: `${stamp}_${suffix}@example.com`,
                    password: 'temporary-pass123',
                }
                const response = await request.post('/api/v1/users', {
                    headers,
                    data: { ...credentials, role: 'user' },
                })
                expect(response.status()).toBe(201)
                const user = (await response.json()).data
                users.push(user.id)
                return { ...credentials, ...user }
            }
            async function createOrder(token) {
                const books = (await (await request.get('/api/v1/books?limit=100')).json()).data
                const book = books.find((book) => book.inStock)
                const cart = await request.post('/api/v1/cart', {
                    headers: auth(token),
                    data: { bookId: book.id, quantity: 1 },
                })
                expect(cart.status()).toBe(200)
                const quote = (await cart.json()).data.quote
                const response = await request.post('/api/v1/orders', {
                    headers: { ...auth(token), 'Idempotency-Key': crypto.randomUUID() },
                    data: {
                        expectedTotal: quote.total,
                        shippingAddress: {
                            fullName: 'E2E Buyer',
                            line1: 'Vodičkova 12',
                            city: 'Praha',
                            postalCode: '11000',
                            country: 'CZ',
                            phone: '+420777123456',
                        },
                    },
                })
                expect(response.status()).toBe(201)
                const order = (await response.json()).data
                orders.push(order.id)
                return order
            }
            try {
                await use({ ...session, headers, stamp, createUser, createOrder, trackUser: (id) => users.push(id) })
            } finally {
                for (const id of orders) {
                    const read = await request.get(`/api/v1/orders/${id}`, { headers })
                    expect(read.status()).toBe(200)
                    if (
                        (await read.json()).data.allowedTransitions.some(
                            (action) => action.axis === 'status' && action.to === 'cancelled'
                        )
                    )
                        expect(
                            (
                                await request.patch(`/api/v1/orders/${id}/status`, {
                                    headers,
                                    data: { status: 'cancelled' },
                                })
                            ).status()
                        ).toBe(200)
                }
                for (const id of users)
                    expect(
                        (
                            await request.patch(`/api/v1/users/${id}/status`, { headers, data: { isActive: false } })
                        ).status()
                    ).toBe(200)
                for (const id of users)
                    expect((await (await request.get(`/api/v1/users/${id}`, { headers })).json()).data.isActive).toBe(
                        false
                    )
            }
        },
        { timeout: 30000 },
    ],
})
export async function tabTo(page, target, stops, label) {
    await expect(target).toBeVisible()
    for (let step = 0; step < 150; step++) {
        if (await target.evaluate((el) => el === document.activeElement || el.contains(document.activeElement))) {
            stops.push(label)
            return
        }
        await page.keyboard.press('Tab')
    }
    throw new Error(`Keyboard could not reach ${label}`)
}
export async function settle(page) {
    await page.evaluate(() => document.fonts.ready)
    await page.waitForFunction(() => !document.querySelector('[class*="-enter-active"], [class*="-leave-active"]'))
    await page.waitForFunction(() =>
        document
            .getAnimations()
            .every(
                (animation) =>
                    animation.effect?.getTiming().iterations === Infinity || animation.playState !== 'running'
            )
    )
}
export async function inspectAdmin(page, locale, screen, testInfo) {
    await settle(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    const result = await new AxeBuilder({ page }).analyze()
    const findings = result.violations.map((rule) => ({
        id: rule.id,
        impact: rule.impact,
        nodes: rule.nodes.map((node) => ({
            target: node.target,
            html: node.html,
            failureSummary: node.failureSummary,
        })),
    }))
    await testInfo.attach(`${locale}-${screen}-axe`, {
        body: JSON.stringify(findings, null, 2),
        contentType: 'application/json',
    })
    expect(findings.filter((rule) => ['serious', 'critical'].includes(rule.impact))).toEqual([])
    const small = await page
        .locator('main button, main a, [role="dialog"] button, nav a, header button')
        .evaluateAll((elements) =>
            elements
                .filter((element) => element.checkVisibility({ visibilityProperty: true }) && !element.disabled)
                .map((element) => ({
                    name: element.getAttribute('aria-label') ?? element.textContent.trim(),
                    box: element.getBoundingClientRect().toJSON(),
                }))
                .filter(({ box }) => box.width > 0 && (box.width < 24 || box.height < 24))
        )
    expect(small).toEqual([])
    const previous = page.viewportSize()
    const directory = process.env.BOOKSTORE_ADMIN_EVIDENCE
    if (directory) {
        mkdirSync(directory, { recursive: true })
        writeFileSync(path.join(directory, `${locale}-${screen}-axe.json`), JSON.stringify(findings, null, 2))
        for (const width of [1280, 1440, 390, 360, 768]) {
            await page.setViewportSize({ width, height: width < 800 ? 844 : 900 })
            await page.evaluate(() => window.scrollTo(0, 0))
            await settle(page)
            await page.screenshot({ path: path.join(directory, `${locale}-${screen}-${width}.png`), fullPage: true })
        }
    }
    await page.setViewportSize({ width: 320, height: 844 })
    await settle(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    // CSS zoom exercises 200% layout scaling; native browser zoom/NVDA remain separate manual checks.
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.evaluate(() => {
        document.documentElement.style.zoom = '2'
    })
    await settle(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.evaluate(() => {
        document.documentElement.style.zoom = ''
    })
    await page.setViewportSize(previous)
    await page.evaluate(() => window.scrollTo(0, 0))
}
