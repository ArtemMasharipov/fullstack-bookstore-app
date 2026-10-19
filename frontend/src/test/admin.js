import { createApp, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { vi } from 'vitest'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore } from '@/stores/auth'
import { useNotifications } from '@/composables/useNotifications'

/** Real routed components, Vuetify and translations, shared only by tests. */
export async function mountAdmin(component, { path = '/admin/users', routeName = 'AdminUsers', locale = 'cs' } = {}) {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale(locale)
    activateLocale(locale)
    useNotifications().clear()
    const prepare = (record) =>
        record.children
            ? { ...record, children: record.children.map(prepare) }
            : { ...record, component: record.name === routeName ? component : { render: () => null } }
    const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
    await router.push(path)
    const pinia = createPinia()
    useAuthStore(pinia).$patch({ user: { id: 'self', username: 'admin', role: 'admin' } })
    const root = document.createElement('div')
    document.body.append(root)
    const app = createApp({ render: () => h(components.VApp, null, { default: () => h(RouterView) }) })
        .use(pinia)
        .use(router)
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await router.isReady()
    await nextTick()
    return {
        app,
        root,
        router,
        words: { cs, en }[locale],
        cleanup() {
            app.unmount()
            document.body.replaceChildren()
            useNotifications().clear()
            vi.unstubAllGlobals()
        },
    }
}

export const input = (label, within = document) => {
    const item = [...within.querySelectorAll('label')].find((element) => element.textContent.trim() === label)
    return item ? document.getElementById(item.htmlFor) : null
}
export const button = (text, within = document) =>
    [...within.querySelectorAll('button')].find((element) => element.textContent.trim() === text)
export async function type(element, value) {
    element.value = value
    element.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}
export const deferred = () => {
    let resolve, reject
    const promise = new Promise((yes, no) => {
        resolve = yes
        reject = no
    })
    return { promise, resolve, reject }
}
