import { expect, test } from '@playwright/test'
import { SEEDED } from './credentials.js'
import { signIn } from './support.js'

// The storefront's first load carries no admin code: the admin layout and its pages load when an admin page opens

// The paths of the scripts a page loads until the network is quiet
async function scriptsOf(page, path) {
    const scripts = []
    page.on('response', (response) => {
        if (response.request().resourceType() === 'script') scripts.push(new URL(response.url()).pathname)
    })
    await page.goto(path, { waitUntil: 'networkidle' })
    return scripts
}

for (const path of ['/', '/books', '/en/books']) {
    test(`the storefront downloads no admin code on ${path}`, async ({ page }) => {
        const scripts = await scriptsOf(page, path)

        expect(scripts.length).toBeGreaterThan(0)
        expect(scripts.filter((script) => /admin/i.test(script))).toEqual([])
    })
}

test('the admin area loads its code when an admin page opens', async ({ page }) => {
    await signIn(page, SEEDED.admin)

    const scripts = await scriptsOf(page, '/admin')

    expect(scripts.some((script) => /Admin/.test(script))).toBe(true)
})
