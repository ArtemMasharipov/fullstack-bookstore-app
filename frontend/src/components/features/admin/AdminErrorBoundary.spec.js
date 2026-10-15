import { afterEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { i18n, loadLocale, activateLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import AdminErrorBoundary from './AdminErrorBoundary.vue'
let app
afterEach(() => {
    app?.unmount()
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    document.body.replaceChildren()
})
it('captures a real child failure and displays safe copy instead of raw diagnostics', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify(en)))
    await loadLocale('en')
    activateLocale('en')
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: '/', component: { render: () => null } }],
    })
    await router.push('/')
    const root = document.createElement('div')
    document.body.append(root)
    const Child = {
        render() {
            throw new Error('private sentinel')
        },
    }
    app = createApp({ render: () => h(AdminErrorBoundary, {}, { default: () => h(Child) }) })
        .use(i18n)
        .use(router)
        .use(createVuetify({ components }))
    const uncaught = vi.fn()
    const diagnostics = vi.spyOn(console, 'info').mockImplementation(() => {})
    app.config.errorHandler = uncaught
    app.mount(root)
    await nextTick()
    expect(root.textContent).toContain('Admin panel error')
    expect(root.textContent).not.toContain('private sentinel')
    expect(uncaught).not.toHaveBeenCalled()
    expect(diagnostics).toHaveBeenCalledWith('Error Info:', 'render function')
})
