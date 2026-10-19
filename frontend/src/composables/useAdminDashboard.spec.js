import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { h } from 'vue'
import { deferred, mountAdmin } from '@/test/admin'
const api = vi.hoisted(() => ({ books: vi.fn(), authors: vi.fn(), orders: vi.fn(), users: vi.fn(), recent: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: { fetchAll: api.books } }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: { fetchAll: api.authors } }))
vi.mock('@/services/api/usersApi', () => ({ usersApi: { stats: api.users } }))
vi.mock('@/services/api/orderApi', () => ({ orderApi: { adminStats: api.orders, adminList: api.recent } }))
import { useAdminDashboard } from './useAdminDashboard'
let state, mounted
const Harness = {
    setup() {
        state = useAdminDashboard()
        return () => h('p')
    },
}
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    api.books.mockResolvedValue({ data: [{}], pagination: { total: 31 } })
    api.authors.mockResolvedValue({ data: [{}], pagination: { total: 24 } })
    api.orders.mockResolvedValue({ total: 12, pendingOrders: 3, paidOrders: 4, totalRevenue: 37314, currency: 'CZK' })
    api.users.mockResolvedValue({ total: 26, active: 21 })
    api.recent.mockResolvedValue({ items: [] })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount() {
    mounted = await mountAdmin(Harness, { path: '/admin', routeName: 'AdminDashboard' })
    await vi.waitFor(() => expect(api.books).toHaveBeenCalled())
}
it('loads independent server aggregates with limit1 and a newest5 request', async () => {
    await mount()
    await vi.waitFor(() => expect(state.resources.books.data).toBe(31))
    expect(state.resources.authors.data).toBe(24)
    expect(api.books).toHaveBeenCalledWith({ page: 1, limit: 1 })
    expect(api.authors).toHaveBeenCalledWith({ page: 1, limit: 1 })
    expect(api.recent).toHaveBeenCalledWith({ page: 1, limit: 5, sortBy: '-createdAt' })
    expect(state.resources.orders.data.totalRevenue).toBe(37314)
    expect(state.resources.users.data.active).toBe(21)
})
it('retries only the failed resource and deduplicates repeated order retries', async () => {
    api.orders.mockRejectedValueOnce({ code: 'INTERNAL' })
    await mount()
    await vi.waitFor(() => expect(state.resources.orders.error).toEqual({ code: 'INTERNAL' }))
    await vi.waitFor(() => expect(state.resources.orders.loading).toBe(false))
    expect(state.resources.books.data).toBe(31)
    const waiting = deferred()
    api.orders.mockReturnValueOnce(waiting.promise)
    const first = state.reload('orders'),
        second = state.reload('orders')
    await vi.waitFor(() => expect(api.orders).toHaveBeenCalledTimes(2))
    waiting.resolve({ total: 0, pendingOrders: 0, paidOrders: 0, totalRevenue: 0, currency: 'CZK' })
    await Promise.all([first, second])
    expect(state.resources.orders.error).toBeNull()
    expect(state.resources.orders.data.total).toBe(0)
    expect(api.books).toHaveBeenCalledTimes(1)
    expect(api.recent).toHaveBeenCalledTimes(1)
})
it('ignores responses after disposal', async () => {
    await mount()
    await vi.waitFor(() => expect(state.resources.books.data).toBe(31))
    const waiting = deferred()
    api.books.mockReturnValueOnce(waiting.promise)
    const pending = state.reload('books')
    await mounted.router.push('/admin/orders')
    waiting.resolve({ pagination: { total: 999 } })
    await pending
    expect(state.resources.books.data).toBe(31)
})
