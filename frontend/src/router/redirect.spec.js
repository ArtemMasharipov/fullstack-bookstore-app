import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { buildRoutes } from './buildRoutes'
import { loginRoute, redirectTarget } from './redirect'

function testRouter() {
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}

const router = testRouter()

describe('redirectTarget', () => {
    it.each([
        ['/en/checkout', 'en', '/en/checkout'],
        ['/checkout', 'en', '/en/checkout'],
        ['/en/orders?page=2#top', 'cs', '/orders?page=2#top'],
        ['/orders/0123456789abcdef01234567', 'cs', '/orders/0123456789abcdef01234567'],
    ])('opens %s in %s as %s', (value, locale, path) => {
        expect(router.resolve(redirectTarget(router, value, locale)).fullPath).toBe(path)
    })

    it.each([
        undefined,
        '',
        'checkout',
        'https://evil.example/',
        '//evil.example/',
        '/\\evil.example',
        'javascript:alert(1)',
        '/%2F%2Fevil.example',
        '/no-such-page',
        '/login',
        '/en/register',
        '/books\n',
        ['/checkout', '/orders'],
    ])('refuses %j', (value) => {
        expect(redirectTarget(router, value, 'cs')).toBeNull()
    })
})

describe('loginRoute', () => {
    it('carries the way back to the page in ?redirect', () => {
        const login = router.resolve(loginRoute('/en/checkout', 'en'))
        expect(login.path).toBe('/en/login')
        expect(login.query.redirect).toBe('/en/checkout')
    })

    it('has no query without a way back', () => {
        const login = router.resolve(loginRoute(undefined, 'cs'))
        expect(login.path).toBe('/login')
        expect(login.query).toEqual({})
    })
})
