import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import ErrorMessage from './ErrorMessage.vue'
import ErrorView from '@/views/errors/ErrorView.vue'
import { createMemoryHistory, createRouter } from 'vue-router'

let app, root
beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('en')
    root = document.createElement('div')
    document.body.append(root)
})
afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})
function mount(props = {}) {
    app = createApp({ render: () => h(ErrorMessage, props) })
        .use(i18n)
        .use(createVuetify({ components }))
    const warnings = []
    app.config.warnHandler = (message) => warnings.push(message)
    app.mount(root)
    return warnings
}
describe('safe shared error UI', () => {
    it('supports absent message and renders only safe fallback without warnings', () => {
        const warnings = mount()
        expect(warnings).toEqual([])
        expect(root.textContent).toContain('Something went wrong')
        expect(root.textContent).not.toContain('Retry')
    })
    it('reactively resolves known codes while ignoring legacy and server sentinel copy', async () => {
        mount({ code: 'CONFLICT', error: { message: '<img src=x>private sentinel' }, message: 'private sentinel' })
        expect(root.textContent).toContain('changed')
        expect(root.textContent).not.toContain('private sentinel')
        activateLocale('cs')
        await nextTick()
        expect(root.textContent).toContain('zm\u011bnila')
        expect(root.querySelector('img')).toBeNull()
    })
    it('only retries the caller handler, expands local support notice and retains close', async () => {
        let attempts = 0,
            closed = 0
        mount({ message: 'private sentinel', onRetry: () => attempts++, onClose: () => closed++ })
        const find = (text) => [...root.querySelectorAll('button')].find((b) => b.textContent.includes(text))
        find('Retry').click()
        expect(attempts).toBe(1)
        find('Contact').click()
        await nextTick()
        expect(root.textContent).toContain('Support channel is not configured')
        root.querySelector('.v-alert__close button').click()
        expect(closed).toBe(1)
        expect(root.textContent).not.toContain('private sentinel')
    })
})

it('error route ignores raw query/params and reacts to stable codes and locale', async () => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/error/:error?', component: ErrorView },
            { path: '/:locale(en)?', name: 'Home', component: { render: () => null } },
        ],
    })
    await router.push('/error/private%20sentinel?message=private%20sentinel')
    app = createApp({ render: () => h(ErrorView) })
        .use(i18n)
        .use(router)
        .use(createVuetify({ components }))
    app.mount(root)
    await nextTick()
    expect(root.textContent).not.toContain('private sentinel')
    expect(root.textContent).toContain('Something went wrong')
    await router.push('/error?code=CONFLICT')
    await nextTick()
    expect(root.textContent).toContain('changed')
    activateLocale('cs')
    await nextTick()
    expect(root.textContent).toContain('zm\u011bnila')
})
