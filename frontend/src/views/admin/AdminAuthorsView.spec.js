import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
const authors = vi.hoisted(() => ({ fetchAll: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))
import AdminAuthorsView from './AdminAuthorsView.vue'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'
import { buildRoutes } from '@/router/buildRoutes'
import { useNotifications } from '@/composables/useNotifications'

const DATA = Array.from({ length: 12 }, (_, i) => ({
    id: `a${i + 1}`,
    firstName: `Karel ${i + 1}`,
    lastName: `Writer ${i + 1}`,
    bio: 'Biography',
    country: 'CZ',
    birthYear: 1900,
    booksCount: 3,
    createdAt: '2026-10-19T00:00:00Z',
    updatedAt: '2026-10-19T00:00:00Z',
}))
const pageOf = ({ page = 1, limit = 10 } = {}, total = 12) => ({
    success: true,
    data: DATA.slice(0, total).slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
})
const Page = { render: () => null }
const prepare = (route) =>
    route.children
        ? { ...route, children: route.children.map(prepare) }
        : { ...route, component: route.name === 'AdminAuthors' ? AdminAuthorsView : Page }
const fill = (text, params) =>
    Object.entries(params).reduce((value, [key, part]) => value.replace(`{${key}}`, part), text)
let app, router, root, words
beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    Object.values(authors).forEach((fn) => fn.mockReset())
    authors.fetchAll.mockImplementation(async (params) => pageOf(params))
    useNotifications().clear()
})
afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
    useNotifications().clear()
})
async function mount(path = '/admin/authors', locale = 'cs') {
    await loadLocale(locale)
    activateLocale(locale)
    words = { cs, en }[locale]
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
    await router.push(path)
    root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(RouterView) }) })
        .use(createPinia())
        .use(router)
        .use(i18n)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenCalled())
    await vi.waitFor(() => expect(root.querySelector('.v-data-table-progress')).toBeNull())
    await nextTick()
}
const rows = () => [...root.querySelectorAll('tbody tr')]
const button = (text, within = document) =>
    [...within.querySelectorAll('button')].find((el) => el.textContent.trim() === text)
const byLabel = (name) => document.querySelector(`[aria-label="${name}"]`)
const input = (label, within = document) => {
    const el = [...within.querySelectorAll('label')].find((item) => item.textContent.trim() === label)
    return document.getElementById(el.htmlFor)
}
const type = async (el, value) => {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
}
const choose = async (label, option) => {
    input(label)
        .closest('.v-field')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() =>
        expect([...document.querySelectorAll('.v-list-item')].some((el) => el.textContent.trim() === option)).toBe(true)
    )
    ;[...document.querySelectorAll('.v-list-item')].find((el) => el.textContent.trim() === option).click()
    await nextTick()
}
const dialog = () => document.querySelector('[role="dialog"]')
const notices = () => useNotifications().notifications.value
const name = (author) => `${author.firstName} ${author.lastName}`
const askDelete = async (author) => {
    const opener = byLabel(fill(words.admin.authors.delete, { name: name(author) }))
    opener.focus()
    opener.click()
    await vi.waitFor(() => expect(dialog()).not.toBeNull())
    return opener
}

describe('AdminAuthorsView', () => {
    it('cancels the draft when synchronizing an author search from the address', async () => {
        await mount('/admin/authors?q=Writer')
        const field = input(words.admin.authors.search)
        await type(field, 'stale draft')
        await router.push('/admin/authors?q=Restored')
        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(router.currentRoute.value.query.q).toBe('Restored')
        expect(field.value).toBe('Restored')
    })
    it.each(['', 'Writer'])('cancels a draft search when it returns to the applied query %j', async (applied) => {
        await mount(applied ? '/admin/authors?q=Writer' : '/admin/authors')
        const field = input(words.admin.authors.search)
        await type(field, 'stale draft')
        await type(field, applied)
        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(router.currentRoute.value.query.q ?? '').toBe(applied)
        expect(field.value).toBe(applied)
        expect(authors.fetchAll).toHaveBeenCalledTimes(1)
    })
    it.each([false, true])('reflects a committed save after closing the form (reopen: %s)', async (reopen) => {
        let resolveSave
        authors.create.mockReturnValue(
            new Promise((resolve) => {
                resolveSave = resolve
            })
        )
        const created = { ...DATA[0], id: 'new-author', firstName: 'New', lastName: 'Saved' }
        authors.fetchAll.mockResolvedValueOnce(pageOf()).mockResolvedValueOnce({
            ...pageOf(),
            data: [created, ...DATA.slice(0, 9)],
        })
        await mount()
        button(words.admin.authors.add).click()
        await vi.waitFor(() => expect(dialog()?.querySelector('form')).not.toBeNull())
        await type(input(words.admin.authorForm.firstName, dialog()), 'New')
        await type(input(words.admin.authorForm.lastName, dialog()), 'Saved')
        button(words.admin.form.save, dialog()).click()
        await vi.waitFor(() => expect(authors.create).toHaveBeenCalledTimes(1))
        button(words.modal.cancel, dialog()).click()
        await nextTick()
        if (reopen) {
            byLabel(fill(words.admin.authors.edit, { name: name(DATA[0]) })).click()
            await vi.waitFor(() => expect(input(words.admin.authorForm.firstName, dialog()).value).toBe('Karel 1'))
            await type(input(words.admin.authorForm.bio, dialog()), 'Keep this draft')
        }
        resolveSave({ success: true, data: created })
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].messageKey).toBe('admin.authors.created')
        await vi.waitFor(() => expect(root.textContent).toContain('New Saved'))
        expect(authors.fetchAll).toHaveBeenCalledTimes(2)
        if (reopen) {
            expect(dialog().textContent).toContain(words.admin.authorForm.editTitle)
            expect(input(words.admin.authorForm.bio, dialog()).value).toBe('Keep this draft')
        }
    })
    it('loads the server page and displays its canonical fields and book count', async () => {
        await mount('/admin/authors?page=2&limit=10&q=Writer&sortBy=lastName')
        expect(authors.fetchAll).toHaveBeenCalledWith({ page: 2, limit: 10, search: 'Writer', sortBy: 'lastName' })
        await vi.waitFor(() => expect(rows()).toHaveLength(2))
        for (const part of ['Karel 11 Writer 11', 'CZ', '1900', '3']) expect(rows()[0].textContent).toContain(part)
        expect(root.querySelector('h1')).toBeNull()
    })
    it.each(['firstName', '-firstName', 'lastName', '-lastName', 'birthYear', '-birthYear', 'createdAt', '-createdAt'])(
        'changes %s through a named sort select from a later page',
        async (sortBy) => {
            await mount(`/admin/authors?page=2&sortBy=${sortBy === 'firstName' ? 'lastName' : 'firstName'}`)
            const key = sortBy.replace(/^-/, '') + (sortBy.startsWith('-') ? 'Desc' : 'Asc')
            await choose(words.admin.authors.sort, words.admin.authors.sorts[key])
            await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy }))
            expect(router.currentRoute.value.query.page).toBeUndefined()
        }
    )
    it('exposes sortable name and year headers as buttons with aria-sort', async () => {
        await mount()
        const heading = [...root.querySelectorAll('th')].find((th) =>
            th.textContent.includes(words.admin.authors.columns.name)
        )
        expect(heading.querySelector('button')).not.toBeNull()
        heading.querySelector('button').click()
        await vi.waitFor(() =>
            expect(authors.fetchAll).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy: 'lastName' })
        )
        expect(heading.getAttribute('aria-sort')).toBe('ascending')
    })
    it('canonicalizes invalid query values before loading', async () => {
        await mount('/admin/authors?page=0&sortBy=unknown&foo=1')
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/authors'))
        expect(authors.fetchAll).toHaveBeenCalledTimes(1)
        expect(authors.fetchAll).toHaveBeenCalledWith({ page: 1, limit: 10, sortBy: '-createdAt' })
    })
    it('shows a load error with retry', async () => {
        authors.fetchAll.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mount()
        await vi.waitFor(() => expect(root.textContent).toContain(words.admin.table.loadError))
        button(words.errors.retry).click()
        await vi.waitFor(() => expect(rows()).toHaveLength(10))
        expect(authors.fetchAll).toHaveBeenCalledTimes(2)
    })
    it('distinguishes an empty list and no search results and resets the search', async () => {
        authors.fetchAll.mockResolvedValue(pageOf({}, 0))
        await mount('/admin/authors?q=absent')
        await vi.waitFor(() => expect(root.textContent).toContain(words.admin.authors.noResults))
        button(words.catalog.resetFilters).click()
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/authors'))
        await vi.waitFor(() => expect(root.textContent).toContain(words.admin.authors.empty))
    })
    it.each(['cs', 'en'])('%s creates and edits through the dialog with one notification per save', async (locale) => {
        await mount(locale === 'en' ? '/en/admin/authors' : '/admin/authors', locale)
        authors.create.mockResolvedValue({ success: true, data: DATA[0] })
        button(words.admin.authors.add).click()
        await vi.waitFor(() => expect(dialog()?.querySelector('form')).not.toBeNull())
        await type(input(words.admin.authorForm.firstName, dialog()), 'Jane')
        await type(input(words.admin.authorForm.lastName, dialog()), 'Writer')
        button(words.admin.form.save, dialog()).click()
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].messageKey).toBe('admin.authors.created')
        expect(authors.fetchAll).toHaveBeenCalledTimes(2)
        useNotifications().clear()
        byLabel(fill(words.admin.authors.edit, { name: name(DATA[0]) })).click()
        await vi.waitFor(() => expect(input(words.admin.authorForm.firstName, dialog()).value).toBe('Karel 1'))
        authors.update.mockResolvedValue({ success: true, data: DATA[0] })
        button(words.admin.form.save, dialog()).click()
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].messageKey).toBe('admin.authors.updated')
    })
    it('cancels deletion and restores its opener focus', async () => {
        await mount()
        const opener = await askDelete(DATA[0])
        button(words.modal.cancel, dialog()).click()
        await vi.waitFor(() => expect(document.activeElement).toBe(opener))
        expect(authors.delete).not.toHaveBeenCalled()
    })
    it('returns from a deleted last page and focuses the add button', async () => {
        let total = 11
        let resolvePage
        const nextPage = new Promise((resolve) => {
            resolvePage = resolve
        })
        authors.fetchAll.mockImplementation(async (params) =>
            total === 10 && params.page === 1 ? nextPage : pageOf(params, total)
        )
        authors.delete.mockImplementation(async () => {
            total = 10
        })
        await mount('/admin/authors?page=2')
        await askDelete(DATA[10])
        button(words.admin.authors.deleteConfirm, dialog()).click()
        await vi.waitFor(() => expect(router.currentRoute.value.fullPath).toBe('/admin/authors'))
        resolvePage(pageOf({ page: 1, limit: 10 }, 10))
        await vi.waitFor(() => expect(rows()).toHaveLength(10))
        expect(authors.delete).toHaveBeenCalledWith('a11')
        expect(notices()).toHaveLength(1)
        await vi.waitFor(() => expect(document.activeElement).toBe(button(words.admin.authors.add, root)))
    })
    it('explains the book count when the API refuses deletion', async () => {
        authors.delete.mockRejectedValue({
            code: 'AUTHOR_HAS_BOOKS',
            details: { books: 3 },
            message: 'PRIVATE_SERVER_TEXT',
        })
        await mount()
        await askDelete(DATA[0])
        button(words.admin.authors.deleteConfirm, dialog()).click()
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0]).toMatchObject({
            type: 'error',
            messageKey: 'errors.AUTHOR_HAS_BOOKS',
            messageParams: { count: 3 },
        })
        expect(rows()).toHaveLength(10)
        expect(authors.fetchAll).toHaveBeenCalledTimes(1)
    })
    it('does not send a second deletion while the first is pending', async () => {
        let reject
        authors.delete.mockReturnValue(
            new Promise((_, no) => {
                reject = no
            })
        )
        await mount()
        await askDelete(DATA[0])
        const confirm = button(words.admin.authors.deleteConfirm, dialog())
        confirm.click()
        confirm.click()
        expect(authors.delete).toHaveBeenCalledTimes(1)
        reject({ code: 'INTERNAL' })
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
    })
    it('restores the row focus after a delayed deletion failure re-enables it', async () => {
        let reject
        authors.delete.mockReturnValue(
            new Promise((_, no) => {
                reject = no
            })
        )
        await mount()
        const opener = await askDelete(DATA[0])
        button(words.admin.authors.deleteConfirm, dialog()).click()
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 30))
        reject({ code: 'AUTHOR_HAS_BOOKS', details: { books: 3 } })
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        await vi.waitFor(() => expect(document.activeElement).toBe(opener))
    })
    it('cancels pending author search when opening books', async () => {
        await mount()
        await type(input(words.admin.authors.search), 'stale author search')
        await router.push('/admin/books?q=keep')
        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(router.currentRoute.value.fullPath).toBe('/admin/books?q=keep')
    })
})
