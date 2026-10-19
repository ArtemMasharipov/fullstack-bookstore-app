import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountAdmin } from '@/test/admin'
import { useBooksStore, useAuthorsStore, useOrdersStore } from '@/stores'
import { formatMoney } from '@/utils/money'
const api = vi.hoisted(() => ({ books: vi.fn(), authors: vi.fn(), orders: vi.fn(), users: vi.fn(), recent: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: { fetchAll: api.books } }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: { fetchAll: api.authors } }))
vi.mock('@/services/api/usersApi', () => ({
    usersApi: { stats: api.users, fetchAll: vi.fn().mockResolvedValue({ data: [] }) },
}))
vi.mock('@/services/api/orderApi', () => ({ orderApi: { adminStats: api.orders, adminList: api.recent } }))
import View from './AdminDashboardView.vue'
let mounted, words
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.books.mockResolvedValue({ data: [{ id: 'b' }], pagination: { total: 31 } })
    api.authors.mockResolvedValue({ data: [{ id: 'a' }], pagination: { total: 24 } })
    api.orders.mockResolvedValue({ total: 12, pendingOrders: 3, paidOrders: 4, totalRevenue: 37314, currency: 'CZK' })
    api.users.mockResolvedValue({ total: 26, active: 21 })
    api.recent.mockResolvedValue({
        items: Array.from({ length: 5 }, (_, i) => ({
            id: `o${i}`,
            orderNumber: `ORD-${i}`,
            customer: null,
            createdAt: '2026-10-19T10:00:00Z',
            status: 'pending',
            paymentStatus: 'unpaid',
            quote: { total: 3858, currency: 'CZK' },
        })),
        pagination: { total: 12 },
    })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount(locale = 'cs') {
    mounted = await mountAdmin(View, {
        path: locale === 'en' ? '/en/admin' : '/admin',
        locale,
        routeName: 'AdminDashboard',
    })
    words = mounted.words
    await vi.waitFor(() => expect(api.orders).toHaveBeenCalled())
    await vi.waitFor(() => expect(mounted.root.querySelectorAll('[data-card]')).toHaveLength(7))
    await vi.waitFor(() => expect(mounted.root.querySelectorAll('[role="status"]')).toHaveLength(0))
}
describe.each(['cs', 'en'])('AdminDashboardView (%s)', (locale) => {
    it('shows aggregate counts, money and real recent links without changing storefront state', async () => {
        await mount(locale)
        for (const [name, value] of Object.entries({
            books: '31',
            authors: '24',
            total: '12',
            pending: '3',
            paid: '4',
            revenue: formatMoney(37314),
            users: '26',
        }))
            expect(mounted.root.querySelector(`[data-card="${name}"]`).textContent).toContain(value)
        expect(mounted.root.querySelector('[data-card="users"]').textContent).toContain('21')
        expect(mounted.root.querySelectorAll('tbody tr')).toHaveLength(5)
        const link = mounted.root.querySelector('tbody a')
        expect(link.getAttribute('href')).toBe(`${locale === 'en' ? '/en' : ''}/admin/orders/o0`)
        expect(mounted.root.textContent).toContain(words.admin.orders.deletedCustomer)
        expect(mounted.root.querySelector('h1')).toBeNull()
        expect(useBooksStore().books).toEqual([])
        expect(useAuthorsStore().list).toEqual([])
        expect(useOrdersStore().list).toEqual([])
    })
    it('shows a failed resource with Retry while keeping other ready values', async () => {
        api.books.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mount(locale)
        const card = mounted.root.querySelector('[data-card="books"]')
        expect(card.textContent).toContain(words.admin.dashboard.loadError)
        expect(card.textContent).not.toContain('0')
        expect(mounted.root.querySelector('[data-card="authors"]').textContent).toContain('24')
        card.querySelector('button').click()
        await vi.waitFor(() => expect(card.textContent).toContain('31'))
        expect(api.authors).toHaveBeenCalledTimes(1)
        expect(api.orders).toHaveBeenCalledTimes(1)
    })
})
