import { expect } from '@playwright/test'
import { test, dictionaries, inspectAdmin } from './admin-support.js'
import { signIn } from './support.js'
import { SEEDED } from './credentials.js'
for (const locale of ['cs', 'en']) {
    const prefix = locale === 'en' ? '/en' : '',
        words = dictionaries[locale]
    test(`${locale}: dashboard equals current API aggregates and latest five real orders`, async ({
        page,
        adminData,
    }, testInfo) => {
        test.setTimeout(90000)
        await signIn(page, SEEDED.admin, prefix)
        const read = async (url) =>
            await (await page.request.get(`/api/v1/${url}`, { headers: adminData.headers })).json()
        const [books, authors, orders, users, recent] = await Promise.all(
            [
                'books?limit=1',
                'authors?limit=1',
                'orders/admin/stats',
                'users/stats',
                'orders/admin/all?limit=5&sortBy=-createdAt',
            ].map(read)
        )
        await page.goto(`${prefix}/admin`)
        const revenue = new Intl.NumberFormat(locale === 'en' ? 'en-GB' : 'cs-CZ', {
            style: 'currency',
            currency: orders.data.currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(orders.data.totalRevenue / 100)
        for (const [key, value] of Object.entries({
            books: books.pagination.total,
            authors: authors.pagination.total,
            total: orders.data.total,
            pending: orders.data.pendingOrders,
            paid: orders.data.paidOrders,
            revenue,
            users: users.data.total,
        }))
            await expect(page.locator(`[data-card="${key}"] .text-h4`)).toHaveText(String(value))
        await expect(page.locator('[data-card="users"]')).toContainText(
            words.admin.dashboard.activeUsers.replace('{count}', users.data.active)
        )
        await expect(page.locator('tbody tr')).toHaveCount(recent.data.length)
        for (const [index, order] of recent.data.entries()) {
            const row = page.locator('tbody tr').nth(index)
            await expect(row).toContainText(order.orderNumber)
            await expect(row.getByRole('link', { name: order.orderNumber })).toHaveAttribute(
                'href',
                `${prefix}/admin/orders/${order.id}`
            )
        }
        await inspectAdmin(page, locale, 'dashboard', testInfo)
    })
}
