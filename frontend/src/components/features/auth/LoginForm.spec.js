import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const auth = vi.hoisted(() => ({ login: vi.fn() }))
const cart = vi.hoisted(() => ({ fetch: vi.fn(), merge: vi.fn() }))
vi.mock('@/services/api/authService', () => ({ authApi: auth }))
vi.mock('@/services/api/cartApi', () => ({ cartApi: cart }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import LoginForm from './LoginForm.vue'

// A token the client can read, valid until 2100
const TOKEN = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.'
const USER = { id: 'u1', email: 'jana@example.com', name: 'Jana' }

let app
let router

function testRouter() {
    const prepare = (record) => ({
        ...record,
        component: { render: () => null },
        ...(record.children ? { children: record.children.map(prepare) } : {}),
    })
    return createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
}

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    localStorage.clear()
    auth.login.mockReset()
    cart.fetch.mockReset()
    cart.merge.mockReset()
    auth.login.mockResolvedValue({ data: { user: USER, token: TOKEN } })
    cart.fetch.mockResolvedValue({ items: [], quote: null })
    setActivePinia(createPinia())
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(path, locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    router = testRouter()
    await router.push(path)
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(LoginForm) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

async function signIn(email = USER.email, password = 'secret123') {
    for (const [selector, value] of [
        ['input[autocomplete="username"]', email],
        ['input[autocomplete="current-password"]', password],
    ]) {
        const field = document.querySelector(selector)
        field.value = value
        field.dispatchEvent(new Event('input'))
    }
    await nextTick()
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('LoginForm', () => {
    it('opens the page from ?redirect after signing in, in the current language', async () => {
        await mount('/en/login?redirect=/checkout', 'en')

        await signIn()

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/en/checkout'))
    })

    it('opens Home when ?redirect points outside the app', async () => {
        await mount('/login?redirect=//evil.example')

        await signIn()

        await vi.waitFor(() => expect(auth.login).toHaveBeenCalled())
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/'))
    })

    it('shows that the email or password is wrong, not the server text', async () => {
        auth.login.mockRejectedValueOnce(
            Object.assign(new Error('Invalid credentials'), { status: 401, code: 'UNAUTHORIZED' })
        )
        await mount('/login?redirect=/checkout')

        await signIn()

        await vi.waitFor(() =>
            expect(document.querySelector('.v-alert')?.textContent).toContain('E-mail nebo heslo nejsou správné.')
        )
        expect(document.body.textContent).not.toContain('Invalid credentials')
        expect(router.currentRoute.value.fullPath).toBe('/login?redirect=/checkout')
    })

    it.each([
        ['en', '/en/login', 'Too many attempts. Try again in 10 min.'],
        ['cs', '/login', 'Příliš mnoho pokusů. Zkuste to znovu za 10 min.'],
    ])('tells when to try again after too many attempts (%s)', async (locale, path, text) => {
        auth.login.mockRejectedValueOnce(
            Object.assign(new Error('Too many failed attempts'), {
                status: 429,
                code: 'RATE_LIMITED',
                details: { retryAfter: 600 },
            })
        )
        await mount(path, locale)

        await signIn()

        await vi.waitFor(() => expect(document.querySelector('.v-alert')?.textContent).toContain(text))
    })

    it('speaks Czech on the Czech page', async () => {
        await mount('/login')

        expect(document.body.textContent).toContain('Přihlášení')
        expect(document.querySelector('form button[type="submit"]').textContent).toContain('Přihlásit se')
        expect(document.body.textContent).not.toContain('wishlist')
    })

    it('requires both fields before it calls the server', async () => {
        await mount('/login')

        await signIn('', '')

        await vi.waitFor(() => {
            const messages = [...document.querySelectorAll('.v-messages__message')].map((m) => m.textContent)
            expect(messages).toEqual(['Zadejte e-mail.', 'Zadejte heslo.'])
        })
        expect(auth.login).not.toHaveBeenCalled()
    })

    it('keeps the way back on the link to registration', async () => {
        await mount('/login?redirect=/checkout')

        const link = [...document.querySelectorAll('a')].find(
            (anchor) => router.resolve(anchor.getAttribute('href')).name === 'Register'
        )

        expect(router.resolve(link.getAttribute('href')).query.redirect).toBe('/checkout')
    })
})
