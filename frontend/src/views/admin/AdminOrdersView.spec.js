import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, mountAdmin } from '@/test/admin'
import { formatMoney } from '@/utils/money'
const api = vi.hoisted(() => ({ adminList: vi.fn() }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: api }))
import AdminOrdersView from './AdminOrdersView.vue'
const DATA = Array.from({ length: 23 }, (_, index) => ({
    id: `o${index}`,
    orderNumber: `ORD-${index}`,
    customer: index ? null : { email: 'buyer@example.com' },
    createdAt: '2026-10-19T00:00:00Z',
    status: 'pending',
    paymentStatus: index ? 'refunded' : 'unpaid',
    quote: { currency: 'CZK', total: index ? 3858 : 34900 },
}))
const pageOf = ({ page = 1, limit = 10, paymentStatus } = {}) => {
    const items = DATA.filter((row) => !paymentStatus || row.paymentStatus === paymentStatus)
    return {
        items: items.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: items.length, pages: Math.ceil(items.length / limit) },
    }
}
let mounted, words
beforeEach(() => api.adminList.mockReset().mockImplementation(async (params) => pageOf(params)))
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount(path = '/admin/orders', locale = 'cs') {
    mounted = await mountAdmin(AdminOrdersView, { path, locale, routeName: 'AdminOrders' })
    words = mounted.words
    await vi.waitFor(() => expect(api.adminList).toHaveBeenCalled())
    await vi.waitFor(() => expect(mounted.root.querySelector('.v-data-table-progress')).toBeNull())
}
const rows = () => [...mounted.root.querySelectorAll('tbody tr')]
async function choose(selector, value) {
    mounted.root.querySelector(selector).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() =>
        expect([...document.querySelectorAll('.v-list-item')].some((el) => el.textContent.trim() === value)).toBe(true)
    )
    ;[...document.querySelectorAll('.v-list-item')].find((el) => el.textContent.trim() === value).click()
    await nextTick()
}
describe.each(['cs', 'en'])('AdminOrdersView (%s)', (locale) => {
    it('loads server pages without search or arbitrary status controls', async () => {
        await mount(`${locale === 'en' ? '/en' : ''}/admin/orders?q=ignored`, locale)
        expect(api.adminList).toHaveBeenCalledWith({ page: 1, limit: 10, sortBy: '-createdAt' })
        expect(rows()).toHaveLength(10)
        expect(rows()[0].textContent).toContain('buyer@example.com')
        expect(rows()[0].textContent).toContain(formatMoney(34900))
        expect(rows()[1].textContent).toContain(formatMoney(3858))
        expect(rows()[1].textContent).toContain(words.admin.orders.deletedCustomer)
        expect(mounted.root.querySelector('input[type="search"], input[type="radio"], h1')).toBeNull()
        await mounted.router.push({ query: { page: '2' } })
        await vi.waitFor(() => expect(rows()[0].textContent).toContain('ORD-10'))
        expect(api.adminList).toHaveBeenLastCalledWith({ page: 2, limit: 10, sortBy: '-createdAt' })
    })
    it('keeps filters, date sort and page size in the URL and supports Back', async () => {
        await mount('/admin/orders?page=2&paymentStatus=refunded', locale)
        button(words.admin.orders.columns.createdAt, mounted.root).click()
        await vi.waitFor(() =>
            expect(api.adminList).toHaveBeenLastCalledWith({
                page: 1,
                limit: 10,
                sortBy: 'createdAt',
                paymentStatus: 'refunded',
            })
        )
        await choose('.v-data-table-footer .v-field', '20')
        await vi.waitFor(() =>
            expect(api.adminList).toHaveBeenLastCalledWith({
                page: 1,
                limit: 20,
                sortBy: 'createdAt',
                paymentStatus: 'refunded',
            })
        )
        mounted.router.back()
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query.limit).toBeUndefined())
        mounted.router.back()
        await vi.waitFor(() => expect(rows()[0].textContent).toContain('ORD-11'))
    })
})
it('hides stale rows on failure and retries the current page', async () => {
    await mount()
    api.adminList.mockRejectedValueOnce({ code: 'INTERNAL' })
    await mounted.router.push({ query: { page: '2' } })
    await vi.waitFor(() => expect(mounted.root.textContent).toContain(words.admin.table.loadError))
    expect(mounted.root.textContent).not.toContain('buyer@example.com')
    button(words.errors.retry).click()
    await vi.waitFor(() => expect(rows()[0].textContent).toContain('ORD-10'))
})
it('does not publish a late page after leaving and recovers after an aborted leave', async () => {
    await mount()
    const waiting = deferred()
    api.adminList.mockReturnValueOnce(waiting.promise)
    await mounted.router.push({ query: { page: '2' } })
    const stop = mounted.router.beforeResolve((to) => (to.name === 'AdminUsers' ? false : undefined))
    await mounted.router.push('/admin/users')
    stop()
    await vi.waitFor(() => expect(rows()[0].textContent).toContain('ORD-10'))
    await mounted.router.push('/admin/users')
    waiting.resolve(pageOf({ page: 1 }))
    await nextTick()
    expect(mounted.router.currentRoute.value.name).toBe('AdminUsers')
    expect(mounted.root.textContent).not.toContain('ORD-0')
})
it('distinguishes an empty result from a load failure', async () => {
    api.adminList.mockResolvedValue({ items: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } })
    await mount()
    expect(mounted.root.textContent).toContain(words.admin.orders.empty)
    expect(mounted.root.textContent).not.toContain(words.admin.table.loadError)
})
