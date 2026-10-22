import { expect } from '@playwright/test'
import { writeFileSync } from 'node:fs'
import { cs as vuetifyCs, en as vuetifyEn } from 'vuetify/locale'
import { test, dictionaries, inspectAdmin, tabTo, loginApi } from './admin-support.js'
import { SEEDED } from './credentials.js'

for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : '',
        words = dictionaries[locale],
        footer = (locale === 'en' ? vuetifyEn : vuetifyCs).dataFooter
    test(`${locale}: keyboard user management, real pagination and self restrictions`, async ({
        page,
        adminData,
    }, testInfo) => {
        test.setTimeout(120000)
        const stops = [],
            rolesRequests = []
        page.on('request', (request) => {
            if (new URL(request.url()).pathname.includes('/roles')) rolesRequests.push(request.url())
        })
        for (let index = 0; index < 11; index++) await adminData.createUser(`page${index}`)
        const buyer = await adminData.createUser('buyer')
        const buyerSession = await loginApi(page.request, buyer)
        const ownOrder = await adminData.createOrder(buyerSession.token)
        await page.goto(`${prefix}/login`)
        await page.locator('input[autocomplete="username"]').focus()
        await page.keyboard.type(SEEDED.admin.email)
        await page.keyboard.press('Tab')
        await page.keyboard.type(SEEDED.admin.password)
        await page.keyboard.press('Enter')
        await expect(page).not.toHaveURL((url) => url.pathname.endsWith('/login'))
        stops.push('Keyboard login')
        await tabTo(page, page.locator('header button:has(.v-avatar)'), stops, 'Account menu')
        await page.keyboard.press('Enter')
        const adminItem = page.locator('.v-overlay__content .v-list-item').filter({ hasText: words.nav.admin })
        await expect(adminItem).toBeVisible()
        for (let step = 0; step < 8; step++) {
            if (await adminItem.evaluate((el) => el === document.activeElement || el.contains(document.activeElement)))
                break
            await page.keyboard.press('ArrowDown')
        }
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL((url) => url.pathname === `${prefix}/admin`)
        const nav = page.getByRole('navigation', { name: words.admin.navLabel })
        await tabTo(
            page,
            nav.getByRole('link', { name: new RegExp(`^${words.routes.AdminOrders}`) }),
            stops,
            'Orders navigation'
        )
        await page.keyboard.press('Enter')
        await tabTo(
            page,
            page.getByRole('link', { name: ownOrder.orderNumber, exact: true }),
            stops,
            'Order detail link'
        )
        await page.keyboard.press('Enter')
        await expect(page.getByRole('heading', { level: 2 })).toContainText(ownOrder.orderNumber)
        await tabTo(
            page,
            nav.getByRole('link', { name: new RegExp(`^${words.routes.AdminUsers}`) }),
            stops,
            'Users navigation'
        )
        await page.keyboard.press('Enter')
        const search = page.getByLabel(words.admin.users.search, { exact: true })
        await search.fill(adminData.stamp)
        await expect(page).toHaveURL((url) => url.searchParams.get('q') === adminData.stamp)
        await expect(page.locator('tbody tr')).toHaveCount(10)
        await page.getByRole('button', { name: footer.nextPage, exact: true }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('page') === '2')
        await expect(page.locator('tbody tr')).toHaveCount(2)
        await page.reload()
        await expect(page.locator('tbody tr')).toHaveCount(2)
        await page.getByRole('button', { name: words.admin.users.columns.email, exact: true }).click()
        await expect(page).toHaveURL(
            (url) => url.searchParams.get('sortBy') === 'email' && !url.searchParams.has('page')
        )
        await page.getByLabel(footer.itemsPerPageText, { exact: true }).focus()
        await page.keyboard.press('Enter')
        await page.getByRole('option', { name: '20', exact: true }).click()
        await expect(page).toHaveURL((url) => url.searchParams.get('limit') === '20')
        await expect(page.locator('tbody tr')).toHaveCount(12)
        await page.goBack()
        await expect(page).toHaveURL((url) => !url.searchParams.has('limit'))
        await inspectAdmin(page, locale, 'users', testInfo)
        const add = page.getByRole('button', { name: words.admin.users.add, exact: true })
        await tabTo(page, add, stops, 'Create user')
        await page.keyboard.press('Enter')
        let form = page.getByRole('dialog', { name: words.admin.userForm.createTitle })
        await expect(form).toBeVisible()
        const credentials = {
            username: `${adminData.stamp}_ui`,
            email: `${adminData.stamp}_ui@example.com`,
            password: 'temporary-pass123',
        }
        for (const [field, value] of Object.entries(credentials)) {
            await tabTo(page, form.getByLabel(words.admin.userForm[field], { exact: true }), stops, `Create ${field}`)
            await page.keyboard.type(value)
        }
        await inspectAdmin(page, locale, 'user-form', testInfo)
        await tabTo(page, form.getByRole('button', { name: words.admin.form.save, exact: true }), stops, 'Save user')
        const created = page.waitForResponse(
            (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/v1/users'
        )
        await page.keyboard.press('Enter')
        const response = await created
        expect(response.status()).toBe(201)
        const user = (await response.json()).data
        adminData.trackUser(user.id)
        await expect(form).not.toBeVisible()
        await search.fill(user.username)
        const row = page.getByRole('row').filter({ hasText: user.email })
        await expect(row).toBeVisible()
        await row
            .getByRole('button', { name: words.admin.users.edit.replace('{name}', user.username), exact: true })
            .click()
        form = page.getByRole('dialog', { name: words.admin.userForm.editTitle })
        await expect(form.getByLabel(words.admin.userForm.firstName, { exact: true })).toBeEnabled()
        await form.getByLabel(words.admin.userForm.firstName, { exact: true }).fill('Changed')
        await form.getByRole('button', { name: words.admin.form.save, exact: true }).click()
        await expect(form).not.toBeVisible()
        await expect(row).toContainText('Changed')
        for (const [action, nextActive] of [
            ['deactivate', false],
            ['activate', true],
        ]) {
            await tabTo(
                page,
                row.getByRole('button', {
                    name: words.admin.users[action].replace('{name}', user.username),
                    exact: true,
                }),
                stops,
                action
            )
            await page.keyboard.press('Enter')
            const confirm = page.getByRole('dialog', { name: words.admin.users.statusTitle })
            await tabTo(
                page,
                confirm.getByRole('button', { name: words.modal.confirm, exact: true }),
                stops,
                `Confirm ${action}`
            )
            await page.keyboard.press('Enter')
            await expect
                .poll(
                    async () =>
                        (
                            await (
                                await page.request.get(`/api/v1/users/${user.id}`, { headers: adminData.headers })
                            ).json()
                        ).data.isActive
                )
                .toBe(nextActive)
            await expect(row).toContainText(nextActive ? words.admin.users.active : words.admin.users.inactive)
        }
        await search.fill('admin')
        const self = page.getByRole('row').filter({ hasText: SEEDED.admin.email })
        await expect(
            self.getByRole('button', { name: words.admin.users.deactivate.replace('{name}', 'admin'), exact: true })
        ).toBeDisabled()
        await expect(self).toContainText(words.admin.users.selfHint)
        await self.getByRole('button', { name: words.admin.users.edit.replace('{name}', 'admin'), exact: true }).click()
        form = page.getByRole('dialog', { name: words.admin.userForm.editTitle })
        await expect(form.getByLabel(words.admin.userForm.role, { exact: true })).toBeDisabled()
        await page.keyboard.press('Escape')
        expect(rolesRequests).toEqual([])
        const file = testInfo.outputPath(`${locale}-keyboard-stops.json`)
        writeFileSync(file, JSON.stringify(stops, null, 2))
        await testInfo.attach('Keyboard stops', { path: file, contentType: 'application/json' })
    })
}
