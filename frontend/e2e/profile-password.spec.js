import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { dictionaries, auth, loginApi, settle, tabTo } from './admin-support.js'
import { signIn } from './support.js'
import { SEEDED } from './credentials.js'

async function inspect(page, name, testInfo, selector = 'main') {
    await settle(page)
    const result = await new AxeBuilder({ page }).include(selector).analyze()
    const findings = result.violations.map((rule) => ({
        id: rule.id,
        impact: rule.impact,
        targets: rule.nodes.map((node) => node.target),
    }))
    await testInfo.attach(name + '-axe', { body: JSON.stringify(findings, null, 2), contentType: 'application/json' })
    expect(findings.filter((rule) => ['serious', 'critical'].includes(rule.impact) || rule.id === 'label')).toEqual([])
    const small = await page.locator(selector + ' button, ' + selector + ' a').evaluateAll((elements) =>
        elements
            .filter((el) => el.checkVisibility({ visibilityProperty: true }) && !el.disabled)
            .map((el) => ({
                name: el.getAttribute('aria-label') || el.textContent.trim(),
                box: el.getBoundingClientRect().toJSON(),
            }))
            .filter(({ box }) => box.width > 0 && (box.width < 24 || box.height < 24))
    )
    expect(small).toEqual([])
    const previous = page.viewportSize()
    await page.setViewportSize({ width: 320, height: 844 })
    await settle(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.setViewportSize(previous)
}
async function rejectedToken(request, token) {
    expect((await request.get('/api/v1/auth/me', { headers: auth(token) })).status()).toBe(401)
}

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : ''
    const words = dictionaries[locale]
    test(locale + ': registration, profile, rotation and all-device sign-out', async ({ page, browser }, testInfo) => {
        test.setTimeout(180000)
        const stamp = String(Date.now()) + String(Math.floor(Math.random() * 1000))
        const user = {
            username: 'profile' + stamp,
            email: 'profile' + stamp + '@example.com',
            password: 'Silver meadow 58!',
        }
        await page.goto(prefix + '/profile')
        await expect(page).toHaveURL(
            (url) => url.pathname === prefix + '/login' && url.searchParams.get('redirect') === prefix + '/profile'
        )
        await page.goto(prefix + '/register')
        await inspect(page, locale + '-register-normal', testInfo)
        await page.locator('#username').fill(user.username)
        await page.locator('#email').fill(user.email)
        const submitRegistration = page.locator('form button[type="submit"]')
        await page.locator('#password').fill('a'.repeat(14))
        await page.locator('#confirmPassword').fill('a'.repeat(14))
        await submitRegistration.click()
        await expect(page.locator('#password')).toHaveAttribute('aria-invalid', 'true')
        await expect(page.locator('.v-alert[tabindex="-1"]')).toBeFocused()
        await page.locator('#password').fill('123456789012345')
        await page.locator('#confirmPassword').fill('123456789012345')
        const common = page.waitForResponse(
            (response) => response.url().endsWith('/auth/register') && response.status() === 400
        )
        await submitRegistration.click()
        await common
        await expect(page.locator('form')).toContainText(words.profile.passwordErrors.common)
        await inspect(page, locale + '-register-error', testInfo)
        await page.locator('#password').fill(user.password)
        await page.locator('#confirmPassword').fill(user.password)
        let release
        const hold = new Promise((resolve) => {
            release = resolve
        })
        await page.route('**/auth/register', async (route) => {
            await hold
            await route.continue()
        })
        try {
            await submitRegistration.click()
            await expect(submitRegistration).toBeDisabled()
            await inspect(page, locale + '-register-pending', testInfo)
        } finally {
            release()
            await page.unrouteAll({ behavior: 'wait' })
        }
        await expect(page).not.toHaveURL((url) => url.pathname.endsWith('/register'))
        await page.goto(prefix + '/profile')
        await expect(page.locator('#profile-username')).toHaveValue(user.username)
        await inspect(page, locale + '-profile-normal', testInfo)
        const first = page.getByLabel(words.profile.firstName, { exact: true })
        await first.fill('Jana')
        await page.getByLabel(words.profile.lastName, { exact: true }).fill('Nováková')
        const save = page.getByRole('button', { name: words.profile.save, exact: true })
        const saved = page.waitForResponse(
            (response) => response.url().endsWith('/auth/profile') && response.status() === 200
        )
        await save.click()
        await saved
        await expect(page.locator('header button:has(.v-avatar)')).toContainText('Jana Nováková')
        await page.reload()
        await expect(first).toHaveValue('Jana')
        const oldToken = await page.evaluate(() => localStorage.getItem('token'))
        const secondContext = await browser.newContext({ baseURL: new URL(page.url()).origin })
        try {
            const second = await secondContext.newPage()
            const secondToken = await signIn(second, user, prefix)
            const current = page.getByLabel(words.profile.currentPassword, { exact: true })
            const fresh = page.getByLabel(words.profile.newPassword, { exact: true })
            const change = page.getByRole('button', { name: words.profile.changePassword, exact: true })
            await current.fill('wrong current password')
            await fresh.fill('a'.repeat(64))
            await change.click()
            await expect(page.locator('form')).toHaveCount(2)
            await expect(page.locator('main')).toContainText(words.profile.passwordErrors.incorrect)
            await expect(current).toHaveAttribute('aria-invalid', 'true')
            expect(await page.evaluate(() => localStorage.getItem('token'))).toBe(oldToken)
            await inspect(page, locale + '-profile-error', testInfo)
            await current.fill(user.password)
            const reveal = page.getByRole('button', { name: words.profile.showNew, exact: true })
            const stops = []
            await tabTo(page, reveal, stops, 'Reveal new password')
            await expect(reveal).toBeFocused()
            expect(await reveal.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe('3px')
            await page.keyboard.press('Space')
            await expect(fresh).toHaveAttribute('type', 'text')
            await page.keyboard.press('Shift+Tab')
            await expect(fresh).toBeFocused()
            await page.keyboard.press('Tab')
            await page.keyboard.press('Enter')
            await expect(fresh).toHaveAttribute('type', 'password')
            await testInfo.attach(locale + '-keyboard', {
                body: JSON.stringify(stops),
                contentType: 'application/json',
            })
            let releasePassword
            const passwordHold = new Promise((resolve) => {
                releasePassword = resolve
            })
            await page.route('**/auth/password', async (route) => {
                await passwordHold
                await route.continue()
            })
            try {
                await change.click()
                await expect(change).toBeDisabled()
                await expect(save).toBeDisabled()
                await inspect(page, locale + '-profile-pending', testInfo)
            } finally {
                releasePassword()
                await page.unrouteAll({ behavior: 'wait' })
            }
            await expect(current).toHaveValue('')
            await expect(fresh).toHaveValue('')
            const replacement = await page.evaluate(() => localStorage.getItem('token'))
            expect(replacement).not.toBe(oldToken)
            await rejectedToken(page.request, oldToken)
            await rejectedToken(page.request, secondToken)
            expect((await page.request.get('/api/v1/auth/me', { headers: auth(replacement) })).status()).toBe(200)
            expect(
                (
                    await page.request.post('/api/v1/auth/login', {
                        data: { emailOrUsername: user.email, password: user.password },
                    })
                ).status()
            ).toBe(401)
            const finalSecond = await loginApi(second.request, { ...user, password: 'a'.repeat(64) })
            await page.getByRole('main').getByRole('link', { name: words.profile.orders, exact: true }).click()
            await expect(page).toHaveURL((url) => url.pathname === prefix + '/orders')
            await page.goto(prefix + '/profile')
            await page.getByRole('button', { name: words.profile.logoutAll, exact: true }).click()
            await expect(page).toHaveURL(
                (url) => url.pathname === prefix + '/login' && !url.searchParams.has('redirect')
            )
            await rejectedToken(page.request, replacement)
            await rejectedToken(second.request, finalSecond.token)
        } finally {
            await secondContext.close()
        }
    })
    test(locale + ': admin create-user uses server password rules', async ({ page }, testInfo) => {
        test.setTimeout(120000)
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(prefix + '/admin/users')
        await page.getByRole('button', { name: words.admin.users.add, exact: true }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toContainText(words.profile.passwordHint)
        await inspect(page, locale + '-create-normal', testInfo, '[role="dialog"]')
        const stamp = String(Date.now())
        await dialog.getByLabel(words.admin.userForm.username, { exact: true }).fill('policy' + stamp)
        await dialog.getByLabel(words.admin.userForm.email, { exact: true }).fill('policy' + stamp + '@example.com')
        const password = dialog.getByLabel(words.admin.userForm.password, { exact: true })
        const save = dialog.getByRole('button', { name: words.admin.form.save, exact: true })
        for (const [value, code] of [
            ['123456789012345', 'common'],
            ['BOOKSTORE password 47!', 'context'],
        ]) {
            await password.fill(value)
            await save.click()
            await expect(dialog).toContainText(words.profile.passwordErrors[code])
            await expect(dialog.locator('.v-alert[tabindex="-1"]')).toBeFocused()
            await expect(password).toHaveValue(value)
            await inspect(page, locale + '-create-error-' + code, testInfo, '[role="dialog"]')
        }
        await password.fill('Cedar lantern 47!')
        let release
        const hold = new Promise((resolve) => {
            release = resolve
        })
        await page.route('**/api/v1/users', async (route) => {
            if (route.request().method() === 'POST') await hold
            await route.continue()
        })
        try {
            await save.click()
            await expect(save).toBeDisabled()
            await inspect(page, locale + '-create-pending', testInfo, '[role="dialog"]')
        } finally {
            release()
            await page.unrouteAll({ behavior: 'wait' })
        }
        await expect(dialog).not.toBeVisible()
    })
}
