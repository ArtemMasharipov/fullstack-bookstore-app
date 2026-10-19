import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, resolveComponent } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'

// Every API answers an empty page: the screens render, and no test reaches a server
const api = vi.hoisted(() => {
    const answer = () =>
        Promise.resolve({
            data: { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } },
        })
    return { get: answer, post: answer, put: answer, patch: answer, delete: answer }
})
vi.mock('@/services/api/baseApi', () => ({ default: api, setUnauthorizedHandler: () => {} }))

import { vuetify } from '@/config/vuetify'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useAuthStore } from '@/stores'
import AdminLayout from '@/components/layout/admin/AdminLayout.vue'
import AdminAuthorsView from './AdminAuthorsView.vue'
import AuthorFormDialog from '@/components/features/admin/AuthorFormDialog.vue'
import AdminBooksView from './AdminBooksView.vue'
import AdminDashboardView from './AdminDashboardView.vue'
import AdminOrdersView from './AdminOrdersView.vue'
import AdminUsersView from './AdminUsersView.vue'

// Each admin screen with the app's own Vuetify setup, which registers only the components it lists: a component a
// screen uses but the setup leaves out renders as an unknown element. A change that adds an admin screen adds it
// to this list.
const SCREENS = [
    ['AdminLayout', '/admin', AdminLayout],
    ['AdminDashboardView', '/admin', AdminDashboardView],
    ['AdminBooksView', '/admin/books', AdminBooksView],
    ['AdminAuthorsView', '/admin/authors', AdminAuthorsView],
    ['AuthorFormDialog', '/admin/authors', { render: () => h(AuthorFormDialog, { modelValue: true }) }],
    ['AdminOrdersView', '/admin/orders', AdminOrdersView],
    ['AdminUsersView', '/admin/users', AdminUsersView],
]

let app

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    activateLocale('cs')
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

// Mounts a screen and answers the warnings Vue gave while it rendered, its lazy page and its first data included
async function warningsOf(path, screen) {
    const pinia = createPinia()
    setActivePinia(pinia)
    useAuthStore().$patch({ user: { id: 'u1', username: 'admin', role: 'admin' } })
    const router = createRouter({ history: createMemoryHistory(), routes: buildRoutes() })
    await router.push(path)
    const warnings = []
    const root = document.createElement('div')
    document.body.append(root)
    const content = screen === AdminBooksView || screen === AdminAuthorsView ? RouterView : screen
    app = createApp({ render: () => h(resolveComponent('v-app'), null, { default: () => h(content) }) })
    app.config.warnHandler = (message) => warnings.push(message)
    app.use(pinia).use(i18n).use(router).use(vuetify)
    app.mount(root)
    await router.isReady()
    await new Promise((resolve) => setTimeout(resolve, 50))
    await nextTick()
    return warnings
}

it.each(SCREENS)("%s resolves every component with the app's Vuetify setup", async (_, path, screen) => {
    const warnings = await warningsOf(path, screen)

    expect(warnings.filter((warning) => warning.includes('Failed to resolve component'))).toEqual([])
})
