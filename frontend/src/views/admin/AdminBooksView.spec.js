import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter, RouterView } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const books = vi.hoisted(() => ({
    fetchAll: vi.fn(),
    setStock: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
}))
const authors = vi.hoisted(() => ({ fetchAll: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))
vi.mock('@/services/api/authorsApi', () => ({ authorsApi: authors }))

import { useNotifications } from '@/composables/useNotifications'
import { activateLocale, i18n, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
import { buildRoutes } from '@/router/buildRoutes'
import { formatPrice } from '@/utils'
import AdminBooksView from './AdminBooksView.vue'

const fill = (text, values) => Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, v), text)
const Page = { render: () => null }
const prepare = (record) =>
    record.children
        ? { ...record, children: record.children.map(prepare) }
        : { ...record, component: record.name === 'AdminBooks' ? AdminBooksView : Page }

// A page of GET /books: 24 books in pages of 10
function pageOf(page, { total = 24 } = {}) {
    const count = Math.max(0, Math.min(10, total - (page - 1) * 10))
    return {
        success: true,
        data: Array.from({ length: count }, (_, i) => ({
            id: `b${page}-${i + 1}`,
            title: `Kniha ${page}.${i + 1}`,
            author: { id: 'a1', firstName: 'Karel', lastName: 'Čapek' },
            publicationYear: 1920,
            category: 'Fiction',
            description: '',
            price: 199,
            image: '',
            inStock: true,
        })),
        pagination: { page, limit: 10, total, pages: Math.ceil(total / 10) },
    }
}
const EMPTY = { success: true, data: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } }

let app
let router

beforeEach(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    for (const mock of [...Object.values(books), authors.fetchAll]) mock.mockReset()
    books.fetchAll.mockImplementation(async ({ page }) => pageOf(page))
    authors.fetchAll.mockResolvedValue({ success: true, data: [{ id: 'a1', firstName: 'Karel', lastName: 'Čapek' }] })
    useNotifications().clear()
    await loadLocale('cs')
    activateLocale('cs')
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
    vi.unstubAllGlobals()
})

async function mount(path = '/admin/books') {
    const pinia = createPinia()
    setActivePinia(pinia)
    router = createRouter({ history: createMemoryHistory(), routes: buildRoutes().map(prepare) })
    await router.push(path)
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp({ render: () => h(components.VApp, null, { default: () => h(RouterView) }) })
        .use(pinia)
        .use(i18n)
        .use(router)
        .use(createVuetify({ components, directives }))
    app.mount(root)
    await vi.waitFor(() => expect(books.fetchAll).toHaveBeenCalled())
    await vi.waitFor(() => expect(document.querySelector('.v-data-table-progress')).toBeNull())
    await nextTick()
}

const rows = () => [...document.querySelectorAll('tbody tr')]
const byLabel = (label) => document.querySelector(`[aria-label="${label}"]`)
const buttonNamed = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === text)
const input = (label) => {
    const element = [...document.querySelectorAll('label')].find((l) => l.textContent.trim() === label)
    return document.getElementById(element.htmlFor)
}
const choose = async (label, option) => {
    input(label)
        .closest('.v-field')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() =>
        expect([...document.querySelectorAll('.v-list-item')].some((i) => i.textContent.trim() === option)).toBe(true)
    )
    ;[...document.querySelectorAll('.v-list-item')].find((i) => i.textContent.trim() === option).click()
    await nextTick()
}
const header = (text) => [...document.querySelectorAll('th')].find((th) => th.textContent.includes(text))
const settle = () => new Promise((resolve) => setTimeout(resolve, 50))

it('cancels the draft when synchronizing a book search from the address', async () => {
    await mount('/admin/books?q=Writer')
    const field = input(cs.admin.books.search)
    field.value = 'stale draft'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await router.push('/admin/books?q=Restored')
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(router.currentRoute.value.query.q).toBe('Restored')
    expect(field.value).toBe('Restored')
})

it.each(['', 'Writer'])('cancels a draft book search when it returns to the applied query %j', async (applied) => {
    await mount(applied ? '/admin/books?q=Writer' : '/admin/books')
    const field = input(cs.admin.books.search)
    field.value = 'stale draft'
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    field.value = applied
    field.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(router.currentRoute.value.query.q ?? '').toBe(applied)
    expect(field.value).toBe(applied)
    expect(books.fetchAll).toHaveBeenCalledTimes(1)
})
const notices = () => useNotifications().notifications.value.map((n) => [n.type, n.messageKey])

describe('AdminBooksView', () => {
    it('cancels its pending search when the person opens authors', async () => {
        await mount('/admin/books')
        const search = input(cs.admin.books.search)
        search.value = 'stale book search'
        search.dispatchEvent(new Event('input', { bubbles: true }))
        await nextTick()
        await router.push('/admin/authors?q=keep')
        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(router.currentRoute.value.fullPath).toBe('/admin/authors?q=keep')
    })

    it('lists the page of books the address names, with their author, category, year, price and stock', async () => {
        await mount('/admin/books?page=2')

        expect(books.fetchAll).toHaveBeenCalledWith({ page: 2, limit: 10, sortBy: '-createdAt' })
        await vi.waitFor(() => expect(rows()).toHaveLength(10))
        const first = rows()[0].textContent
        for (const text of ['Kniha 2.1', 'Karel Čapek', 'Fiction', '1920', formatPrice(199)]) {
            expect(first).toContain(text)
        }
        expect(byLabel(fill(cs.admin.books.stockToggle, { title: 'Kniha 2.1' }))).not.toBeNull()
    })

    it('names the filters by their labels', async () => {
        await mount()

        for (const label of [cs.admin.books.category, cs.admin.books.availability]) {
            expect(input(label).getAttribute('aria-label')).toBe(label)
        }
    })

    it('searches and filters on the server', async () => {
        await mount()

        const search = input(cs.admin.books.search)
        search.value = 'Čapek'
        search.dispatchEvent(new Event('input', { bubbles: true }))
        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ q: 'Čapek' }))

        await choose(cs.admin.books.category, 'Fiction')
        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ q: 'Čapek', category: 'Fiction' }))
        await choose(cs.admin.books.availability, cs.catalog.outOfStock)

        await vi.waitFor(() =>
            expect(books.fetchAll).toHaveBeenLastCalledWith({
                page: 1,
                limit: 10,
                sortBy: '-createdAt',
                search: 'Čapek',
                category: 'Fiction',
                inStock: 'false',
            })
        )
    })

    it('tells an empty catalogue from an empty search', async () => {
        books.fetchAll.mockResolvedValue(EMPTY)
        await mount()

        await vi.waitFor(() => expect(document.querySelector('tbody').textContent).toContain(cs.admin.books.empty))
        expect(document.querySelector('tbody').textContent).toContain(cs.admin.books.add)

        await router.push('/admin/books?q=xyz')
        await vi.waitFor(() => expect(document.querySelector('tbody').textContent).toContain(cs.admin.books.noResults))
        buttonNamed(cs.catalog.resetFilters).click()

        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({}))
    })

    it('switches the stock in the row and reports it once', async () => {
        books.setStock.mockResolvedValue({ success: true, data: { ...pageOf(1).data[0], inStock: false } })
        await mount()
        await vi.waitFor(() => expect(rows()).toHaveLength(10))

        byLabel(fill(cs.admin.books.stockToggle, { title: 'Kniha 1.1' })).click()

        await vi.waitFor(() => expect(books.setStock).toHaveBeenCalledWith('b1-1', false))
        await vi.waitFor(() => expect(notices()).toEqual([['success', 'admin.books.nowOutOfStock']]))
        expect(byLabel(fill(cs.admin.books.stockToggle, { title: 'Kniha 1.1' })).checked).toBe(false)
    })

    it('puts the stock back and reports the error once when the change fails', async () => {
        books.setStock.mockRejectedValue({ code: 'INTERNAL' })
        await mount()
        await vi.waitFor(() => expect(rows()).toHaveLength(10))

        byLabel(fill(cs.admin.books.stockToggle, { title: 'Kniha 1.1' })).click()

        await vi.waitFor(() => expect(notices()).toEqual([['error', 'errors.INTERNAL']]))
        expect(byLabel(fill(cs.admin.books.stockToggle, { title: 'Kniha 1.1' })).checked).toBe(true)
    })

    it('deletes a book after confirmation', async () => {
        books.delete.mockResolvedValue('')
        await mount()
        await vi.waitFor(() => expect(rows()).toHaveLength(10))
        const deleteButton = () => byLabel(fill(cs.admin.books.delete, { title: 'Kniha 1.1' }))

        deleteButton().focus()
        deleteButton().click()
        await vi.waitFor(() =>
            expect(document.querySelector('[role="dialog"]').textContent).toContain(
                fill(cs.admin.books.deleteMessage, { title: 'Kniha 1.1' })
            )
        )
        buttonNamed(cs.modal.cancel).click()
        await vi.waitFor(() => expect(document.activeElement).toBe(deleteButton()))
        expect(books.delete).not.toHaveBeenCalled()

        deleteButton().click()
        await vi.waitFor(() => expect(buttonNamed(cs.admin.books.deleteConfirm)).toBeDefined())
        buttonNamed(cs.admin.books.deleteConfirm).click()

        await vi.waitFor(() => expect(books.delete).toHaveBeenCalledWith('b1-1'))
        await vi.waitFor(() => expect(notices()).toEqual([['success', 'admin.books.deleted']]))
        await vi.waitFor(() => expect(books.fetchAll).toHaveBeenCalledTimes(2))
    })

    it('opens the form for a new book and for a row, and reloads after saving', async () => {
        books.update.mockImplementation(async (id, body) => ({
            success: true,
            data: { ...pageOf(1).data[0], ...body },
        }))
        await mount()
        await vi.waitFor(() => expect(rows()).toHaveLength(10))

        buttonNamed(cs.admin.books.add).click()
        await vi.waitFor(() =>
            expect(document.querySelector('[role="dialog"]')?.textContent).toContain(cs.admin.bookForm.createTitle)
        )
        buttonNamed(cs.modal.cancel).click()
        await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull())

        byLabel(fill(cs.admin.books.edit, { title: 'Kniha 1.1' })).click()
        await vi.waitFor(() =>
            expect(document.querySelector('[role="dialog"]')?.textContent).toContain(cs.admin.bookForm.editTitle)
        )
        expect(input(cs.admin.bookForm.title).value).toBe('Kniha 1.1')
        await vi.waitFor(() => expect(authors.fetchAll).toHaveBeenCalled())
        buttonNamed(cs.admin.form.save).click()

        await vi.waitFor(() =>
            expect(books.update).toHaveBeenCalledWith('b1-1', expect.objectContaining({ title: 'Kniha 1.1' }))
        )
        await vi.waitFor(() => expect(notices()).toEqual([['success', 'admin.books.updated']]))
        await vi.waitFor(() => expect(books.fetchAll).toHaveBeenCalledTimes(2))
    })

    it('keeps the sort a header click picks on page 2', async () => {
        await mount('/admin/books?page=2')
        await vi.waitFor(() => expect(rows()).toHaveLength(10))

        header(cs.admin.books.columns.price).click()

        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ sortBy: 'price' }))
        await settle()
        expect(router.currentRoute.value.query).toEqual({ sortBy: 'price' })
    })

    it('keeps a page size picked on page 2', async () => {
        await mount('/admin/books?page=2')
        await vi.waitFor(() => expect(rows()).toHaveLength(10))

        document
            .querySelector('.v-data-table-footer .v-field')
            .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        await vi.waitFor(() =>
            expect([...document.querySelectorAll('.v-list-item')].some((i) => i.textContent.trim() === '20')).toBe(true)
        )
        ;[...document.querySelectorAll('.v-list-item')].find((i) => i.textContent.trim() === '20').click()

        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ limit: '20' }))
        await settle()
        expect(router.currentRoute.value.query).toEqual({ limit: '20' })
    })

    it('returns to page 3 with Back from a short filtered list', async () => {
        books.fetchAll.mockImplementation(async ({ page, category }) => pageOf(page, { total: category ? 3 : 24 }))
        await mount('/admin/books?page=3')
        await vi.waitFor(() => expect(rows()).toHaveLength(4))
        await router.push('/admin/books?category=Fiction')
        await vi.waitFor(() => expect(rows()).toHaveLength(3))

        router.back()

        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ page: '3' }))
        await vi.waitFor(() => expect(rows()).toHaveLength(4))
        await settle()
        expect(router.currentRoute.value.query).toEqual({ page: '3' })
        expect(books.fetchAll).toHaveBeenLastCalledWith({ page: 3, limit: 10, sortBy: '-createdAt' })
    })

    it('shows the last page for a link past it', async () => {
        books.fetchAll.mockImplementation(async ({ page }) => pageOf(page, { total: 15 }))
        await mount('/admin/books?page=3')

        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ page: '2' }))
        await vi.waitFor(() => expect(rows()).toHaveLength(5))
        await settle()
        expect(router.currentRoute.value.query).toEqual({ page: '2' })
    })

    it('shows the load error with a retry', async () => {
        books.fetchAll.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mount()

        await vi.waitFor(() => expect(document.body.textContent).toContain(cs.admin.table.loadError))
        buttonNamed(cs.errors.retry).click()

        await vi.waitFor(() => expect(rows()).toHaveLength(10))
        expect(books.fetchAll).toHaveBeenCalledTimes(2)
        expect(notices()).toEqual([])
    })
})
