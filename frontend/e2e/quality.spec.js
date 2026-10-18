import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { SMOKE_BOOK_TITLE } from '../../backend/scripts/seed-data.js'

import { readFileSync, writeFileSync } from 'node:fs'

// CI can collect portable evidence without a private baseline. Acceptance runs explicitly supply both files.
const baselinePath = process.env.BOOKSTORE_QUALITY_BASELINE
const mappingPath = process.env.BOOKSTORE_QUALITY_MAPPING
const baseline = baselinePath ? JSON.parse(readFileSync(baselinePath, 'utf8').replace(/^\uFEFF/, '')) : null
const mappings = mappingPath ? JSON.parse(readFileSync(mappingPath, 'utf8').replace(/^\uFEFF/, '')) : {}
const normalize = (value) =>
    String(value || '')
        .replace(/[a-f0-9]{24}/g, '<seed-id>')
        .replace(/(?:input|v-menu|v-overlay|v-tooltip)-\d+/g, '<generated-id>')
        .replace(/\s+/g, ' ')
        .trim()
const settle = async (page) =>
    page.evaluate(async () => {
        await document.fonts.ready
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
const cardFor = (page) => page.locator('.book-card').filter({ hasText: SMOKE_BOOK_TITLE })

for (const locale of ['cs', 'en']) {
    test(`${locale}: axe fingerprints and five warm catalog/detail navigations`, async ({
        page,
        browser,
    }, testInfo) => {
        test.setTimeout(180000)
        const prefix = locale === 'en' ? '/en' : ''
        const report = {
            timestamp: new Date().toISOString(),
            chromium: browser.version(),
            viewport: page.viewportSize(),
            locale,
            baselineComparison: Boolean(baseline),
            routes: {},
            perf: {},
        }
        const scan = async (name) => {
            await settle(page)
            const raw = await new AxeBuilder({ page }).analyze()
            const findings = raw.violations.flatMap((rule) =>
                rule.nodes.map((node) => ({
                    id: rule.id,
                    impact: node.impact || rule.impact,
                    target: node.target.map(normalize),
                    html: normalize(node.html),
                    failureSummary: normalize(node.failureSummary),
                }))
            )
            const fingerprints = findings.map((item) => ({
                id: item.id,
                impact: item.impact,
                target: item.target,
                fingerprint: `${item.id}|${item.impact}|${JSON.stringify(item.target)}`,
            }))
            const serious = fingerprints.filter((item) => ['serious', 'critical'].includes(item.impact))
            const previous = baseline?.routes[name].fingerprints.map((item) => item.fingerprint) || []
            const rawAdded = baseline ? serious.filter((item) => !previous.includes(item.fingerprint)) : []
            // Only reviewed exact pairs are mapped. Rule, severity and nth-child remain part of each identity.
            const added = rawAdded.filter((item) => {
                const pair = (mappings[name] || []).find((pair) => pair.current === item.fingerprint)
                return !pair || !previous.includes(pair.baseline)
            })
            report.routes[name] = {
                findings,
                fingerprints,
                rawAdded,
                added,
                passes: raw.passes.map((rule) => rule.id),
                incomplete: raw.incomplete.map((rule) => ({
                    id: rule.id,
                    impact: rule.impact,
                    targets: rule.nodes.map((node) => node.target.map(normalize)),
                })),
            }
            const path = testInfo.outputPath(`${locale}-${name}.json`)
            writeFileSync(path, JSON.stringify(report.routes[name], null, 2), 'utf8')
            await testInfo.attach(`${locale}-${name}`, { path, contentType: 'application/json' })
            const screenshotPath = testInfo.outputPath(`${locale}-${name}.png`)
            await page.screenshot({ path: screenshotPath, fullPage: true })
            await testInfo.attach(`${locale}-${name}-screenshot`, {
                path: screenshotPath,
                contentType: 'image/png',
            })
        }
        await page.goto(`${prefix}/`)
        await expect(page.locator('main')).toBeVisible()
        await scan('home')
        await page.goto(`${prefix}/books`)
        await expect(cardFor(page)).toBeVisible()
        await scan('books')
        await cardFor(page).getByRole('link', { name: SMOKE_BOOK_TITLE }).click()
        await expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
        const detailsPath = new URL(page.url()).pathname
        await scan('book-details')
        await page.goto(`${prefix}/login`)
        await expect(page.locator('#email')).toBeVisible()
        await scan('login')
        await page.goto(`${prefix}/baseline-unknown`)
        await expect(page.locator('main')).toBeVisible()
        await scan('404')
        const ready = async (name) =>
            name === 'catalog'
                ? expect(cardFor(page)).toBeVisible()
                : expect(page.getByRole('heading', { level: 1, name: SMOKE_BOOK_TITLE })).toBeVisible()
        for (const [name, url] of [
            ['catalog', `${prefix}/books`],
            ['details', detailsPath],
        ]) {
            await page.goto(url)
            await ready(name)
            await settle(page)
            const samples = []
            for (let i = 0; i < 5; i++) {
                const start = performance.now()
                await page.goto(url, { waitUntil: 'domcontentloaded' })
                await ready(name)
                await settle(page)
                samples.push({
                    readyMs: performance.now() - start,
                    navigation: await page.evaluate(() => {
                        const n = performance.getEntriesByType('navigation')[0]
                        return {
                            responseStart: n.responseStart,
                            domContentLoadedEventEnd: n.domContentLoadedEventEnd,
                            loadEventEnd: n.loadEventEnd,
                            transferSize: n.transferSize,
                        }
                    }),
                })
            }
            report.perf[name] = { samples, medianReadyMs: samples.map((s) => s.readyMs).sort((a, b) => a - b)[2] }
        }
        const path = testInfo.outputPath(`${locale}-quality.json`)
        writeFileSync(path, JSON.stringify(report, null, 2), 'utf8')
        await testInfo.attach(`${locale}-quality`, { path, contentType: 'application/json' })
        if (!baseline)
            testInfo.annotations.push({
                type: 'baseline',
                description:
                    'Evidence only: set BOOKSTORE_QUALITY_BASELINE and BOOKSTORE_QUALITY_MAPPING for regression acceptance.',
            })
        else
            expect(
                Object.fromEntries(Object.entries(report.routes).map(([name, result]) => [name, result.added])),
                'new serious/critical rule-node fingerprints'
            ).toEqual({ home: [], books: [], 'book-details': [], login: [], 404: [] })
    })
}
