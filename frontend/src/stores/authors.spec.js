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
        expect(store.loading).toBe(false)
    })
})
