import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
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
function authenticate(permissions = []) {
    const token = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.'
    localStorage.setItem('token', token)
    useAuthStore().$patch({ token, user: { name: 'Local admin', role: 'admin' }, permissions })
}

beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
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
    it('preserves admin permission enforcement and language', async () => {
        authenticate()
        const routes = router()
        await routes.push('/en/admin/books')
        expect(routes.currentRoute.value.fullPath).toBe('/en/unauthorized')
        useAuthStore().permissions = ['admin:access']
        await routes.push('/en/admin')
        expect(routes.currentRoute.value.name).toBe('AdminDashboard')
    })
})
