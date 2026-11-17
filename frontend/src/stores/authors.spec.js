import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/services/api/baseApi', () => ({ default: api }))
import { useAuthorsStore } from './authors'

const AUTHOR = {
    id: 'a2',
    firstName: 'Karel',
    lastName: 'Čapek',
    bio: 'Writer',
    booksCount: 1,
    createdAt: '2026-10-19T00:00:00Z',
    updatedAt: '2026-10-19T00:00:00Z',
}
const OTHER = { ...AUTHOR, id: 'a3', firstName: 'Jaroslav', lastName: 'Hašek' }

// An answer of GET /authors or GET /authors/:id as axios resolves it
const listAnswer = (authors, pagination = { page: 1, limit: 12, total: authors.length, pages: 1 }) => ({
    data: { success: true, data: authors, pagination },
})
const detailAnswer = (author) => ({ data: { success: true, data: { author, books: [] } } })

function deferred() {
    let resolve
    let reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

beforeEach(() => {
    setActivePinia(createPinia())
    api.get.mockReset()
})

describe('author views in the storefront store', () => {
    it('unwraps the list and keeps its server pagination', async () => {
        api.get.mockResolvedValue({
            data: { success: true, data: [AUTHOR], pagination: { page: 1, limit: 20, total: 25, pages: 2 } },
        })
        const store = useAuthorsStore()
        await store.fetchAuthors()
        expect(store.list).toEqual([AUTHOR])
        expect([store.page, store.limit, store.total, store.pages]).toEqual([1, 20, 25, 2])
    })
    it('requests included books and unwraps the detail container', async () => {
        const books = [{ id: 'b1', title: 'Krakatit' }]
        api.get.mockResolvedValue({ data: { success: true, data: { author: AUTHOR, books } } })
        const store = useAuthorsStore()
        await store.fetchAuthorById('a2')
        expect(api.get).toHaveBeenCalledWith('/authors/a2', { params: { includeBooks: true } })
        expect(store.current).toEqual({ ...AUTHOR, books })
        expect(store.currentLoading).toBe(false)
    })
    it('asks the API for the page and the search it is given', async () => {
        api.get.mockResolvedValue(listAnswer([AUTHOR]))
        const params = { page: 2, limit: 12, sortBy: 'lastName', search: 'Čap' }
        await useAuthorsStore().fetchAuthors(params)
        expect(api.get).toHaveBeenCalledWith('/authors', { params })
    })
})

describe('answers that arrive out of order', () => {
    it('keeps the newest list when an older answer arrives last', async () => {
        const older = deferred()
        const newer = deferred()
        api.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
        const store = useAuthorsStore()
        const first = store.fetchAuthors({ page: 1 })
        const second = store.fetchAuthors({ page: 2 })

        older.resolve(listAnswer([AUTHOR]))
        await first
        expect(store.loading).toBe(true)
        expect(store.list).toEqual([])

        newer.resolve(listAnswer([OTHER], { page: 2, limit: 12, total: 13, pages: 2 }))
        await second
        expect(store.list).toEqual([OTHER])
        expect(store.page).toBe(2)
        expect(store.loading).toBe(false)
    })
    it('ignores the failure of a list request that is no longer the newest', async () => {
        const older = deferred()
        const newer = deferred()
        api.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
        const store = useAuthorsStore()
        const first = store.fetchAuthors({ page: 1 })
        const second = store.fetchAuthors({ page: 2 })

        newer.resolve(listAnswer([OTHER]))
        await second
        older.reject(Object.assign(new Error('Server error'), { code: 'INTERNAL' }))
        await expect(first).rejects.toMatchObject({ code: 'INTERNAL' })

        expect(store.error).toBeNull()
        expect(store.loading).toBe(false)
        expect(store.list).toEqual([OTHER])
    })
    it('keeps the author of the newest request when an older answer arrives last', async () => {
        const older = deferred()
        const newer = deferred()
        api.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
        const store = useAuthorsStore()
        const first = store.fetchAuthorById('a2')
        const second = store.fetchAuthorById('a3')

        newer.resolve(detailAnswer(OTHER))
        await second
        older.resolve(detailAnswer(AUTHOR))
        await first

        expect(store.current).toEqual({ ...OTHER, books: [] })
        expect(store.currentLoading).toBe(false)
    })
    it('ignores the failure of an author request that is no longer the newest', async () => {
        const older = deferred()
        const newer = deferred()
        api.get.mockReturnValueOnce(older.promise).mockReturnValueOnce(newer.promise)
        const store = useAuthorsStore()
        const first = store.fetchAuthorById('a2')
        const second = store.fetchAuthorById('a3')

        newer.resolve(detailAnswer(OTHER))
        await second
        older.reject(Object.assign(new Error('Not found'), { code: 'NOT_FOUND' }))
        await expect(first).rejects.toMatchObject({ code: 'NOT_FOUND' })

        expect(store.currentError).toBeNull()
        expect(store.current).toEqual({ ...OTHER, books: [] })
    })
})

describe('the list and the open author', () => {
    it('load and fail apart from each other', async () => {
        const list = deferred()
        api.get.mockReturnValueOnce(list.promise).mockResolvedValueOnce(detailAnswer(AUTHOR))
        const store = useAuthorsStore()
        const listing = store.fetchAuthors({ page: 1 })
        await store.fetchAuthorById('a2')

        expect(store.loading).toBe(true)
        expect(store.currentLoading).toBe(false)

        const failure = Object.assign(new Error('Server error'), { code: 'INTERNAL' })
        list.reject(failure)
        await expect(listing).rejects.toBe(failure)

        // The error stays the API error object, so the page translates its code
        expect(store.error).toBe(failure)
        expect(store.loading).toBe(false)
        expect(store.currentError).toBeNull()
        expect(store.current).toEqual({ ...AUTHOR, books: [] })
    })
})
