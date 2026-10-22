import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { button, deferred, input, mountAdmin, type } from '@/test/admin'
import { useNotifications } from '@/composables/useNotifications'
const api = vi.hoisted(() => ({
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    fetchAll: vi.fn(),
}))
vi.mock('@/services/api/usersApi', () => ({ usersApi: api }))
import AdminUsersView from './AdminUsersView.vue'

const DATA = Array.from({ length: 23 }, (_, index) => ({
    id: index ? `u${index}` : 'self',
    username: index ? `user${index}` : 'admin',
    email: `user${index}@example.com`,
    firstName: `Jan ${index}`,
    lastName: 'Novák',
    role: index ? 'user' : 'admin',
    isActive: true,
    lastLogin: null,
    createdAt: '2026-10-19T00:00:00Z',
}))
let mounted, words, records
function pageOf({ page = 1, limit = 10, search, role, isActive } = {}) {
    const data = records.filter(
        (row) =>
            (!search || row.username.includes(search)) &&
            (!role || row.role === role) &&
            (!isActive || String(row.isActive) === isActive)
    )
    return {
        data: data.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total: data.length, pages: Math.ceil(data.length / limit) },
    }
}
beforeEach(() => {
    Object.values(api).forEach((fn) => fn.mockReset())
    records = DATA.map((row) => ({ ...row }))
    api.list.mockImplementation(async (params) => pageOf(params))
    api.fetchAll.mockResolvedValue({ success: true, data: [] })
    api.get.mockImplementation(async (id) => records.find((row) => row.id === id))
    api.setStatus.mockImplementation(async (id, isActive) => {
        const user = records.find((row) => row.id === id)
        user.isActive = isActive
        return { ...user }
    })
})
afterEach(() => {
    mounted?.cleanup()
    mounted = null
})
async function mount(path = '/admin/users', locale = 'cs') {
    mounted = await mountAdmin(AdminUsersView, { path, locale })
    words = mounted.words
    await vi.waitFor(() => expect(api.list).toHaveBeenCalled())
    await vi.waitFor(() => expect(mounted.root.querySelector('.v-data-table-progress')).toBeNull())
}
const rows = () => [...mounted.root.querySelectorAll('tbody tr')]
const dialog = () => document.querySelector('[role="dialog"]')
const named = (label) => document.querySelector(`[aria-label="${label}"]`)
const message = (text, name) => text.replace('{name}', name)
const notices = () => useNotifications().notifications.value
async function choose(label, option) {
    input(label)
        .closest('.v-field')
        .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    await vi.waitFor(() =>
        expect([...document.querySelectorAll('.v-list-item')].some((el) => el.textContent.trim() === option)).toBe(true)
    )
    ;[...document.querySelectorAll('.v-list-item')].find((el) => el.textContent.trim() === option).click()
    await nextTick()
}

describe.each(['cs', 'en'])('AdminUsersView (%s)', (locale) => {
    it('loads a server page with every user column and no extra h1', async () => {
        await mount(`${locale === 'en' ? '/en' : ''}/admin/users?page=2`, locale)
        expect(api.list).toHaveBeenCalledWith({ page: 2, limit: 10, sortBy: '-createdAt' })
        expect(rows()).toHaveLength(10)
        expect(rows()[0].textContent).toContain('user10@example.com')
        expect(rows()[0].textContent).toContain('Jan 10 Novák')
        expect(rows()[0].textContent).toContain(words.common.notAvailable)
        for (const label of Object.values(words.admin.users.columns)) expect(mounted.root.textContent).toContain(label)
        expect(mounted.root.querySelector('h1')).toBeNull()
    })
    it('keeps filters and sort in the address and returns with Back', async () => {
        await mount('/admin/users?page=2', locale)
        await choose(words.admin.users.role, words.admin.roles.user)
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query).toEqual({ role: 'user' }))
        await choose(words.admin.users.sort, words.admin.users.sorts.emailAsc)
        await vi.waitFor(() =>
            expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy: 'email', role: 'user' })
        )
        await mounted.router.back()
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query).toEqual({ role: 'user' }))
        await mounted.router.back()
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query).toEqual({ page: '2' }))
    })
    it('disables self deactivation and explains why', async () => {
        await mount('/admin/users', locale)
        const own = named(message(words.admin.users.deactivate, 'admin'))
        expect(own.disabled).toBe(true)
        expect(rows()[0].textContent).toContain(words.admin.users.selfHint)
    })
    it('edits through a fresh dialog and shows exactly one success', async () => {
        api.update.mockResolvedValue({ ...DATA[1], firstName: 'Changed' })
        await mount('/admin/users', locale)
        named(message(words.admin.users.edit, 'user1')).click()
        await vi.waitFor(() => expect(input(words.admin.userForm.firstName, dialog())?.value).toBe('Jan 1'))
        await type(input(words.admin.userForm.firstName, dialog()), 'Changed')
        button(words.admin.form.save, dialog()).click()
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].messageKey).toBe('admin.users.updated')
        expect(api.get).toHaveBeenCalledWith('u1')
        await vi.waitFor(() => expect(api.list).toHaveBeenCalledTimes(2))
    })
    it('confirms a status change and restores focus if its filtered row disappears', async () => {
        await mount('/admin/users?isActive=true', locale)
        const opener = named(message(words.admin.users.deactivate, 'user1'))
        opener.focus()
        opener.click()
        await vi.waitFor(() => expect(dialog()).toBeTruthy())
        expect(api.setStatus).not.toHaveBeenCalled()
        button(words.modal.confirm, dialog()).click()
        await vi.waitFor(() => expect(api.setStatus).toHaveBeenCalledWith('u1', false))
        await vi.waitFor(() => expect(mounted.root.textContent).not.toContain('user1@example.com'))
        await vi.waitFor(() => expect(document.activeElement).toBe(button(words.admin.users.add)))
        expect(notices()).toHaveLength(1)
        expect(notices()[0].messageKey).toBe('admin.users.deactivated')
    })
})

describe('user list navigation and failures', () => {
    it('sorts the creation date in both directions from its header', async () => {
        await mount()
        button(words.admin.users.columns.createdAt, mounted.root).click()
        await vi.waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy: 'createdAt' }))
    })
    it('canonicalizes the URL, sorts from the header and changes page size', async () => {
        await mount('/admin/users?page=bad&role=owner&unknown=x')
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query).toEqual({}))
        button(words.admin.users.columns.username, mounted.root).click()
        await vi.waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy: 'username' }))
        mounted.root
            .querySelector('.v-data-table-footer .v-field')
            .dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
        await vi.waitFor(() =>
            expect([...document.querySelectorAll('.v-list-item')].some((el) => el.textContent.trim() === '20')).toBe(
                true
            )
        )
        ;[...document.querySelectorAll('.v-list-item')].find((el) => el.textContent.trim() === '20').click()
        await vi.waitFor(() => expect(api.list).toHaveBeenLastCalledWith({ page: 1, limit: 20, sortBy: 'username' }))
    })
    it('creates a user, reloads and notifies once', async () => {
        api.create.mockResolvedValue({ ...DATA[1], username: 'created' })
        await mount()
        button(words.admin.users.add).click()
        await vi.waitFor(() => expect(dialog()).toBeTruthy())
        for (const [key, value] of Object.entries({
            username: 'created',
            email: 'created@example.com',
            password: 'password123',
        }))
            await type(input(words.admin.userForm[key], dialog()), value)
        button(words.admin.form.save, dialog()).click()
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].messageKey).toBe('admin.users.created')
        expect(api.list).toHaveBeenCalledTimes(2)
    })
    it.each(['', 'user'])('cancels a draft search when reverted to %j', async (query) => {
        await mount(query ? `/admin/users?q=${query}` : '/admin/users')
        await type(input(words.admin.users.search), 'stale draft')
        await type(input(words.admin.users.search), query)
        await new Promise((resolve) => setTimeout(resolve, 400))
        expect(mounted.router.currentRoute.value.query.q ?? '').toBe(query)
        expect(api.list).toHaveBeenCalledTimes(1)
    })
    it('does not let a pending search cancel an already started slow navigation', async () => {
        await mount()
        const waiting = deferred()
        mounted.router.beforeResolve((to) => (to.name === 'AdminOrders' ? waiting.promise : undefined))
        await type(input(words.admin.users.search), 'stale')
        const navigation = mounted.router.push('/admin/orders')
        await new Promise((resolve) => setTimeout(resolve, 400))
        waiting.resolve()
        await navigation
        expect(mounted.router.currentRoute.value.fullPath).toBe('/admin/orders')
    })
    it.each(['abort', 'error'])('recovers after an %s during route leave', async (kind) => {
        await mount()
        const stopError = mounted.router.onError(() => {})
        const stop = mounted.router.beforeResolve((to) => {
            if (to.name === 'AdminOrders') {
                if (kind === 'error') throw new Error('Lazy navigation failed')
                return false
            }
        })
        await mounted.router.push('/admin/orders').catch(() => {})
        stop()
        stopError()
        await type(input(words.admin.users.search), 'user1')
        await vi.waitFor(() => expect(mounted.router.currentRoute.value.query.q).toBe('user1'))
    })
    it('hides old rows when a new page fails and retries the current address', async () => {
        await mount()
        api.list.mockRejectedValueOnce({ code: 'INTERNAL' })
        await mounted.router.push('/admin/users?page=2')
        await vi.waitFor(() => expect(mounted.root.textContent).toContain(words.admin.table.loadError))
        expect(mounted.root.textContent).not.toContain('user1@example.com')
        button(words.errors.retry).click()
        await vi.waitFor(() => expect(mounted.root.textContent).toContain('user10@example.com'))
    })
    it('blocks another status action after confirm closes while the first request is pending', async () => {
        const pending = deferred()
        api.setStatus.mockReturnValue(pending.promise)
        await mount()
        named(message(words.admin.users.deactivate, 'user1')).click()
        await vi.waitFor(() => expect(dialog()).toBeTruthy())
        button(words.modal.confirm, dialog()).click()
        await nextTick()
        expect(named(message(words.admin.users.deactivate, 'user2')).disabled).toBe(true)
        pending.reject({ code: 'CONFLICT' })
        await vi.waitFor(() => expect(notices()).toHaveLength(1))
        expect(notices()[0].type).toBe('error')
        expect(api.setStatus).toHaveBeenCalledTimes(1)
    })
})
