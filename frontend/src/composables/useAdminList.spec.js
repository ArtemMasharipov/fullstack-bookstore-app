import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useAdminList } from './useAdminList'

const CONFIG = { sorts: ['-createdAt', 'price', '-price'], defaultSort: '-createdAt', filters: {} }
const Page = { render: () => null }

// A page as the API answers it: rows and the four pagination numbers
const answer = (page, { pages = 3, rows = [`row-${page}`] } = {}) => ({
    data: rows,
    pagination: { page, limit: 10, total: pages * 10, pages },
})

function deferred() {
    let resolve
    const promise = new Promise((res) => {
        resolve = res
    })
    return { promise, resolve }
}

let app
let router
let list
let load

beforeEach(() => {
    load = vi.fn(async ({ page }) => answer(page))
})

afterEach(() => {
    app?.unmount()
    app = undefined
    document.body.replaceChildren()
})

async function mount(path) {
    router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/admin/books', name: 'AdminBooks', component: Page },
            { path: '/admin', name: 'AdminDashboard', component: Page },
        ],
    })
    await router.push(path)
    const Screen = {
        setup() {
            list = useAdminList({ config: CONFIG, load })
            return () => h('div')
        },
    }
    const root = document.createElement('div')
    document.body.append(root)
    app = createApp(Screen).use(router)
    app.mount(root)
    // A wrong address is replaced before anything loads
    await vi.waitFor(() => expect(load).toHaveBeenCalled())
    await vi.waitFor(() => expect(list.loading.value).toBe(false))
}

const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve))
    await nextTick()
}

describe('useAdminList', () => {
    it('loads the page the address names', async () => {
        await mount('/admin/books?page=2&limit=20')

        expect(load).toHaveBeenCalledTimes(1)
        expect(load).toHaveBeenCalledWith({ page: 2, limit: 20, sortBy: '-createdAt' })
        expect(list.items.value).toEqual(['row-2'])
        expect(list.total.value).toBe(30)
        expect(list.state.value.page).toBe(2)
    })

    it('replaces a wrong address with its canonical form without loading twice', async () => {
        await mount('/admin/books?page=1&limit=15&sortBy=__v')

        expect(router.currentRoute.value.fullPath).toBe('/admin/books')
        expect(load).toHaveBeenCalledTimes(1)
        expect(load).toHaveBeenCalledWith({ page: 1, limit: 10, sortBy: '-createdAt' })
    })

    it('moves past the last page back to the last one', async () => {
        load.mockImplementation(async ({ page }) =>
            answer(Math.min(page, 2), { pages: 2, rows: page > 2 ? [] : [`row-${page}`] })
        )

        await mount('/admin/books?page=3')
        await vi.waitFor(() => expect(router.currentRoute.value.query).toEqual({ page: '2' }))
        await vi.waitFor(() => expect(list.items.value).toEqual(['row-2']))

        expect(load).toHaveBeenLastCalledWith({ page: 2, limit: 10, sortBy: '-createdAt' })
    })

    it('keeps only the newest answer', async () => {
        await mount('/admin/books')
        const older = deferred()
        const newer = deferred()
        load.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)

        await list.update({ page: 2 })
        await list.update({ page: 3 })
        newer.resolve(answer(3))
        await settle()
        older.resolve(answer(2))
        await settle()

        expect(list.items.value).toEqual(['row-3'])
        expect(list.loading.value).toBe(false)
    })

    it('starts again from page 1 when the search changes', async () => {
        await mount('/admin/books?page=3&sortBy=price')

        await list.update({ q: 'Čapek' })
        await settle()

        expect(router.currentRoute.value.query).toEqual({ sortBy: 'price', q: 'Čapek' })
        expect(load).toHaveBeenLastCalledWith({ page: 1, limit: 10, sortBy: 'price', search: 'Čapek' })
    })

    it('keeps the error object and loads again on reload', async () => {
        load.mockRejectedValueOnce({ code: 'INTERNAL' })

        await mount('/admin/books')

        expect(list.error.value).toEqual({ code: 'INTERNAL' })
        expect(list.items.value).toEqual([])

        await list.reload()

        expect(list.error.value).toBeNull()
        expect(list.items.value).toEqual(['row-1'])
    })

    it('stops reacting after leaving the list', async () => {
        await mount('/admin/books')

        await router.push('/admin?page=2')
        await settle()

        expect(load).toHaveBeenCalledTimes(1)
    })
})
