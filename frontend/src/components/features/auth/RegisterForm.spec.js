import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const auth = vi.hoisted(() => ({ register: vi.fn() }))
const cart = vi.hoisted(() => ({ fetch: vi.fn(), merge: vi.fn() }))
vi.mock('@/services/api/authService', () => ({ authApi: auth }))
vi.mock('@/services/api/cartApi', () => ({ cartApi: cart }))

import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import RegisterForm from './RegisterForm.vue'

// A token the client can read, valid until 2100
const TOKEN = 'eyJhbGciOiJub25lIn0.' + btoa(JSON.stringify({ exp: 4102444800 })) + '.'
const USER = { id: 'u2', email: 'petr@example.com', username: 'petr', name: 'Petr' }

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
    auth.register.mockReset()
    cart.fetch.mockReset()
    cart.merge.mockReset()
    auth.register.mockResolvedValue({ data: { user: USER, token: TOKEN } })
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
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(RegisterForm) }) })
        .use(i18n)
        .use(createVuetify({ components, directives }))
        .use(router)
    app.mount(root)
    await router.isReady()
    await nextTick()
}

async function register({ password = 'Silver meadow 58!', confirmPassword = password } = {}) {
    for (const [id, value] of [
        ['username', USER.username],
        ['email', USER.email],
        ['password', password],
        ['confirmPassword', confirmPassword],
    ]) {
        const field = document.getElementById(id)
        field.value = value
        field.dispatchEvent(new Event('input'))
    }
    await nextTick()
    document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('RegisterForm', () => {
    it('opens the page from ?redirect after registration', async () => {
        await mount('/register?redirect=/orders')

        await register()

        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/orders'))
    })

    it('sends the account without the repeated password', async () => {
        await mount('/register')

        await register()

        await vi.waitFor(() => expect(auth.register).toHaveBeenCalledTimes(1))
        expect(auth.register.mock.calls[0][0]).toEqual({
            username: USER.username,
            email: USER.email,
            password: 'Silver meadow 58!',
        })
    })

    it('says that the account already exists on CONFLICT', async () => {
        auth.register.mockRejectedValueOnce(
            Object.assign(new Error('Email already registered'), { status: 409, code: 'CONFLICT' })
        )
        await mount('/register')

        await register()

        await vi.waitFor(() =>
            expect(document.querySelector('.v-alert')?.textContent).toContain(
                'Účet s tímto e-mailem nebo uživatelským jménem už existuje.'
            )
        )
        expect(document.body.textContent).not.toContain('Email already registered')
    })

    it.each([
        ['en', '/en/register', 'Too many attempts. Try again in 10 min.'],
        ['cs', '/register', 'Příliš mnoho pokusů. Zkuste to znovu za 10 min.'],
    ])('tells when to try again after too many attempts (%s)', async (locale, path, text) => {
        auth.register.mockRejectedValueOnce(
            Object.assign(new Error('Too many failed attempts'), {
                status: 429,
                code: 'RATE_LIMITED',
                details: { retryAfter: 600 },
            })
        )
        await mount(path, locale)

        await register()

        await vi.waitFor(() => expect(document.querySelector('.v-alert')?.textContent).toContain(text))
    })

    it('asks for matching passwords', async () => {
        await mount('/register')

        await register({ password: 'Silver meadow 58!', confirmPassword: 'secret124' })

        await vi.waitFor(() =>
            expect([...document.querySelectorAll('.v-messages__message')].map((m) => m.textContent)).toContain(
                'Hesla se neshodují.'
            )
        )
        expect(auth.register).not.toHaveBeenCalled()
    })
})
