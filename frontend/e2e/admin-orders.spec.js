import { expect } from '@playwright/test'
import { test, dictionaries, auth, loginApi, inspectAdmin, tabTo } from './admin-support.js'
import { signIn } from './support.js'
import { SEEDED } from './credentials.js'
for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : '',
        words = dictionaries[locale]
    test(`${locale}: a stale cancellation needs a fresh explicit refund confirmation`, async ({ page, adminData }) => {
        const buyer = await adminData.createUser('stale'),
            session = await loginApi(page.request, buyer),
            order = await adminData.createOrder(session.token)
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/orders/${order.id}`)
        const cancel = page.getByRole('button', { name: words.admin.orderDetails.actions.cancelled, exact: true })
        await cancel.click()
        let confirm = page.getByRole('dialog', { name: words.admin.orderDetails.actions.cancelled, exact: true })
        await expect(confirm).toContainText(words.admin.orderDetails.confirmText)
        await expect(confirm).not.toContainText(words.admin.orderDetails.manualRefund)
        expect(
            (
                await page.request.patch(`/api/v1/orders/${order.id}/payment`, {
                    headers: adminData.headers,
                    data: { paymentStatus: 'paid' },
                })
            ).status()
        ).toBe(200)
        const responseTo = () =>
            page.waitForResponse(
                (response) =>
                    response.request().method() === 'PATCH' &&
                    new URL(response.url()).pathname === `/api/v1/orders/${order.id}/status`
            )
        const staleWrite = responseTo()
        await confirm.getByRole('button', { name: words.modal.confirm, exact: true }).click()
        const rejected = await staleWrite
        expect(rejected.status()).toBe(409)
        expect(rejected.request().postDataJSON().expectedState).toEqual({ status: 'pending', paymentStatus: 'unpaid' })
        await expect(
            page.getByRole('button', { name: words.admin.orderDetails.actions.shipped, exact: true })
        ).toBeEnabled()
        let saved = (
            await (await page.request.get(`/api/v1/orders/${order.id}`, { headers: adminData.headers })).json()
        ).data
        expect(saved.status).toBe('processing')
        expect(saved.paymentStatus).toBe('paid')
        expect(saved.statusHistory).toHaveLength(3)
        await cancel.click()
        confirm = page.getByRole('dialog', { name: words.admin.orderDetails.actions.cancelled, exact: true })
        await expect(confirm).toContainText(words.admin.orderDetails.manualRefund)
        const freshWrite = responseTo()
        await confirm.getByRole('button', { name: words.modal.confirm, exact: true }).click()
        const accepted = await freshWrite
        expect(accepted.status()).toBe(200)
        expect(accepted.request().postDataJSON().expectedState).toEqual({ status: 'processing', paymentStatus: 'paid' })
        saved = (await (await page.request.get(`/api/v1/orders/${order.id}`, { headers: adminData.headers })).json())
            .data
        expect(saved.status).toBe('cancelled')
        expect(saved.paymentStatus).toBe('refunded')
        expect(saved.statusHistory).toHaveLength(5)
    })
    test(`${locale}: admin records allowed order transitions, manual refunds and stable pages`, async ({
        page,
        adminData,
    }, testInfo) => {
        test.setTimeout(120000)
        const buyer = await adminData.createUser('orders'),
            session = await loginApi(page.request, buyer),
            orders = []
        for (let index = 0; index < 12; index++) orders.push(await adminData.createOrder(session.token))
        const order = orders[0],
            cancelled = orders[1],
            stops = []
        await signIn(page, SEEDED.admin, prefix)
        await page.goto(`${prefix}/admin/orders?page=2&status=pending&sortBy=createdAt`)
        const expected = (
            await (
                await page.request.get('/api/v1/orders/admin/all?page=2&limit=10&status=pending&sortBy=createdAt', {
                    headers: adminData.headers,
                })
            ).json()
        ).data
        await expect(page.locator('tbody tr')).toHaveCount(expected.length)
        await expect(page.locator('tbody tr').first()).toContainText(expected[0].orderNumber)
        await page.reload()
        await expect(page.locator('tbody tr').first()).toContainText(expected[0].orderNumber)
        const first = page.locator('tbody a').first()
        await tabTo(page, first, stops, 'Order link')
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(
            (url) => url.pathname.includes('/admin/orders/') && url.searchParams.get('page') === '2'
        )
        await page.getByRole('link', { name: words.admin.orderDetails.back, exact: true }).click()
        await expect(page).toHaveURL(
            (url) => url.pathname === `${prefix}/admin/orders` && url.searchParams.get('page') === '2'
        )
        await expect(page.locator('tbody tr').first()).toContainText(expected[0].orderNumber)
        await inspectAdmin(page, locale, 'orders', testInfo)
        await page.goto(`${prefix}/admin/orders/${order.id}`)
        await expect(page.getByRole('heading', { level: 2 })).toContainText(order.orderNumber)
        await inspectAdmin(page, locale, 'order-detail', testInfo)
        async function action(to, manual = false) {
            const control = page.getByRole('button', { name: words.admin.orderDetails.actions[to], exact: true })
            await tabTo(page, control, stops, to)
            await page.keyboard.press('Enter')
            const confirm = page.getByRole('dialog', { name: words.admin.orderDetails.actions[to], exact: true })
            if (manual) await expect(confirm).toContainText(words.admin.orderDetails.manualRefund)
            await tabTo(
                page,
                confirm.getByRole('button', { name: words.modal.confirm, exact: true }),
                stops,
                `Confirm ${to}`
            )
            await page.keyboard.press('Enter')
            await expect(confirm).not.toBeVisible()
            await expect(page.getByRole('progressbar', { name: words.common.loading, exact: true })).toHaveCount(0)
        }
        await action('paid')
        await expect(
            page.getByRole('button', { name: words.admin.orderDetails.actions.shipped, exact: true })
        ).toBeEnabled()
        let saved = (
            await (await page.request.get(`/api/v1/orders/${order.id}`, { headers: adminData.headers })).json()
        ).data
        expect(saved.status).toBe('processing')
        expect(saved.paymentStatus).toBe('paid')
        expect(saved.statusHistory.slice(-2).map((entry) => entry.at)).toEqual([
            saved.statusHistory.at(-1).at,
            saved.statusHistory.at(-1).at,
        ])
        await action('shipped')
        await expect(
            page.getByRole('button', { name: words.admin.orderDetails.actions.delivered, exact: true })
        ).toBeEnabled()
        await action('delivered')
        await expect(
            page.getByRole('button', { name: words.admin.orderDetails.actions.refunded, exact: true })
        ).toBeEnabled()
        await action('refunded', true)
        await expect(page.getByText(words.admin.orderDetails.noActions, { exact: true })).toBeVisible()
        expect(
            (await (await page.request.get(`/api/v1/orders/${order.id}`, { headers: auth(session.token) })).json()).data
                .paymentStatus
        ).toBe('refunded')
        await page.goto(`${prefix}/admin/orders/${cancelled.id}`)
        await action('paid')
        await expect(
            page.getByRole('button', { name: words.admin.orderDetails.actions.shipped, exact: true })
        ).toBeEnabled()
        await action('cancelled', true)
        await expect(page.getByText(words.admin.orderDetails.noActions, { exact: true })).toBeVisible()
        saved = (
            await (await page.request.get(`/api/v1/orders/${cancelled.id}`, { headers: adminData.headers })).json()
        ).data
        expect(saved.status).toBe('cancelled')
        expect(saved.paymentStatus).toBe('refunded')
        expect(saved.statusHistory.slice(-2).map((entry) => entry.at)).toEqual([
            saved.statusHistory.at(-1).at,
            saved.statusHistory.at(-1).at,
        ])
        await page.goto(`${prefix}/admin/orders?paymentStatus=refunded`)
        await expect(page.getByRole('link', { name: order.orderNumber, exact: true })).toBeVisible()
        await expect(page.getByRole('link', { name: cancelled.orderNumber, exact: true })).toBeVisible()
        await testInfo.attach('Keyboard order stops', {
            body: JSON.stringify(stops, null, 2),
            contentType: 'application/json',
        })
    })
}
