import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const auth = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))
vi.mock('@/services/api/authService', () => ({ authApi: auth }))

import { buildRoutes } from '../buildRoutes'
import unifiedGuard from './unified'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

function router() {
    const records = buildRoutes()
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    const instance = createRouter({ history: createMemoryHistory(), routes: records.map(prepare) })
    instance.beforeEach(unifiedGuard)
    return instance
}
// A signed-in session whose cached user has this role
function authenticate(role = 'admin') {
    const token = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.'
    localStorage.setItem('token', token)
    useAuthStore().$patch({ token, user: { name: 'Local admin', role } })
}

// What GET /auth/me answers: the user as the server has it
const serverSays = (role) => auth.getCurrentUser.mockResolvedValue({ success: true, data: { id: 'u1', role } })

beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    auth.getCurrentUser.mockReset()
})
describe('locale-aware access redirects', () => {
    it('keeps full EN destination when a guest is sent to EN Login', async () => {
        const routes = router()
        await routes.push('/en/orders/abc?sort=price#description')
        expect(routes.currentRoute.value.path).toBe('/en/login')
        expect(routes.currentRoute.value.query.redirect).toBe('/en/orders/abc?sort=price#description')
        expect(localStorage.getItem('redirectPath')).toBeNull()
    })
    it('an expired token ends the whole session before Login', async () => {
        const expired = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 1 })) + '.'
        localStorage.setItem('token', expired)
        localStorage.setItem('userData', JSON.stringify({ name: 'Jana' }))
        useAuthStore().$patch({ token: expired, user: { name: 'Jana' } })
        const cart = useCartStore()
        cart.$patch({ lines: [{ bookId: 'a'.repeat(24), title: 'Babička', quantity: 1 }], status: 'ready' })
        const routes = router()

        await routes.push('/en/orders')

        expect(routes.currentRoute.value.path).toBe('/en/login')
        expect(cart.lines).toEqual([])
        expect(localStorage.getItem('userData')).toBeNull()
    })
    it('sends an authenticated guest-only visitor to Home in the requested language', async () => {
        authenticate()
        const routes = router()
        await routes.push('/en/login')
        expect(routes.currentRoute.value.fullPath).toBe('/en')
    })
})

describe('the admin area', () => {
    it('lets an admin into the admin area once the server confirms the role', async () => {
        authenticate('admin')
        serverSays('admin')
        const routes = router()

        await routes.push('/en/admin')

        expect(routes.currentRoute.value.name).toBe('AdminDashboard')
    })

    it('sends a cached admin to Unauthorized when the server says user', async () => {
        authenticate('admin')
        serverSays('user')
        const routes = router()

        await routes.push('/en/admin/books')

        expect(routes.currentRoute.value.fullPath).toBe('/en/unauthorized')
        expect(useAuthStore().user.role).toBe('user')
    })

    it('asks the server once per app load', async () => {
        authenticate('admin')
        serverSays('admin')
        const routes = router()

        await routes.push('/en/admin')
        await routes.push('/en/admin/books')

        expect(routes.currentRoute.value.name).toBe('AdminBooks')
        expect(auth.getCurrentUser).toHaveBeenCalledTimes(1)
    })

    it('keeps the cached role when the server cannot be reached', async () => {
        authenticate('admin')
        auth.getCurrentUser.mockRejectedValue(Object.assign(new Error('offline'), { code: 'NETWORK_ERROR' }))
        const routes = router()

        await routes.push('/en/admin')

        expect(routes.currentRoute.value.name).toBe('AdminDashboard')
    })

    it('sends a user to Unauthorized in the same language', async () => {
        authenticate('user')
        serverSays('user')
        const routes = router()

        await routes.push('/admin')

        expect(routes.currentRoute.value.fullPath).toBe('/unauthorized')
    })
})
