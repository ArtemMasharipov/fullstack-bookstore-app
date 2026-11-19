import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import LoadingSpinner from './LoadingSpinner.vue'

let app

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('cs')
})

afterEach(() => {
    app?.unmount()
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount() {
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(LoadingSpinner) }) })
        .use(i18n)
        .use(createVuetify({ components }))
    app.mount(root)
    await nextTick()
}

describe('LoadingSpinner', () => {
    it.each([
        ['cs', 'Načítání…'],
        ['en', 'Loading…'],
    ])('names the progress indicator in %s', async (locale, name) => {
        activateLocale(locale)
        await mount()

        expect(document.querySelector('[role="progressbar"]').getAttribute('aria-label')).toBe(name)
    })
})
