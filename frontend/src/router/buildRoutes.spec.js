import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { buildRoutes, buildAdminNav } from './buildRoutes'

const router = () => createRouter({ history: createMemoryHistory(), routes: buildRoutes() })

describe('localized route manifest', () => {
    it('resolves both URL languages to the same named detail with business params', () => {
        const routes = router()
        for (const [path, locale] of [
            ['/books/abc?sort=price#description', ''],
            ['/en/books/abc?sort=price#description', 'en'],
        ]) {
            const resolved = routes.resolve(path)
            expect(resolved.name).toBe('BookDetails')
            expect(resolved.params).toEqual({ locale, id: 'abc' })
            expect(resolved.query).toEqual({ sort: 'price' })
            expect(resolved.hash).toBe('#description')
        }
        expect(routes.resolve('/books').name).toBe('Books')
        expect(routes.resolve('/en/books').name).toBe('Books')
    })

    it('keeps one set of named admin children and inherited access at both prefixes', () => {
        const routes = router()
        expect(
            routes
                .getRoutes()
                .filter((r) => r.name?.startsWith('Admin'))
                .map((r) => r.name)
                .sort()
        ).toEqual(['AdminAuthors', 'AdminBooks', 'AdminDashboard', 'AdminOrders', 'AdminSettings', 'AdminUsers'])
        for (const path of ['/admin', '/en/admin', '/en/admin/books']) {
            expect(routes.resolve(path).meta.access).toEqual({ auth: true, permission: 'admin:access' })
        }
        expect(routes.resolve('/en/admin').name).toBe('AdminDashboard')
        expect(routes.getRoutes().find((r) => r.path.endsWith('/admin') && r.children.length)?.name).toBeUndefined()
    })

    it('sends the old order status page to the order details in the same language', async () => {
        for (const [from, to] of [
            ['/orders/abc/status', '/orders/abc'],
            ['/en/orders/abc/status', '/en/orders/abc'],
        ]) {
            const routes = router()
            await routes.push(from)
            expect(routes.currentRoute.value.name).toBe('OrderDetails')
            expect(routes.currentRoute.value.fullPath).toBe(to)
        }
    })

    it('recognizes EN unknown paths and treats an explicit CS prefix as a CS 404', () => {
        const routes = router()
        expect(routes.resolve('/en/unknown/a').params).toEqual({ locale: 'en', pathMatch: ['unknown', 'a'] })
        expect(routes.resolve('/cs/books').name).toBe('NotFound')
        expect(routes.resolve('/cs/books').params).toEqual({ locale: '', pathMatch: ['cs', 'books'] })
    })

    it('provides title and subtitle keys for reactive admin navigation', () => {
        const nav = buildAdminNav()
        expect(nav.main[0]).toMatchObject({
            id: 'AdminDashboard',
            titleKey: 'routes.AdminDashboard',
            subtitleKey: 'admin.nav.dashboard',
            icon: 'mdi-view-dashboard',
            order: 10,
        })
        expect(router().resolve('/en/books').meta.titleKey).toBe('routes.Books')
    })
})
