import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const books = vi.hoisted(() => ({ fetchAll: vi.fn() }))
vi.mock('@/services/api/booksApi', () => ({ booksApi: books }))

import { useBooksStore } from './books'

// A book as GET /books answers it
const book = (id, title) => ({
    id,
    title,
    author: { id: 'a1', firstName: 'Božena', lastName: 'Němcová' },
    publicationYear: 1855,
    category: 'Fiction',
    description: '',
    price: 299,
    image: '',
    inStock: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
})

const page = (items, pagination) => ({ success: true, data: items, pagination })

// A promise with its resolve and reject at hand
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
    books.fetchAll.mockReset()
    setActivePinia(createPinia())
})

describe('books store', () => {
    it('keeps the server pagination of a list', async () => {
        books.fetchAll.mockResolvedValue(page([book('b1', 'Babička')], { page: 2, limit: 12, total: 24, pages: 2 }))
        const store = useBooksStore()

        await store.fetchBooks({ page: 2, limit: 12 })

        expect(store.books.map((b) => b.id)).toEqual(['b1'])
        expect(store.page).toBe(2)
        expect(store.limit).toBe(12)
        expect(store.total).toBe(24)
        expect(store.pages).toBe(2)
    })

    it('ignores a list that answers after a newer request', async () => {
        const first = deferred()
        const second = deferred()
        books.fetchAll.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
        const store = useBooksStore()

        const older = store.fetchBooks({ page: 1, limit: 12 })
        const newer = store.fetchBooks({ page: 2, limit: 12 })
        second.resolve(page([book('b2', 'Krakatit')], { page: 2, limit: 12, total: 24, pages: 2 }))
        await newer

        expect(store.loading).toBe(false)

        first.resolve(page([book('b1', 'Babička')], { page: 1, limit: 12, total: 24, pages: 2 }))
        await older

        expect(store.books.map((b) => b.id)).toEqual(['b2'])
        expect(store.page).toBe(2)
        expect(store.loading).toBe(false)
    })

    it('keeps loading on while the newest request is still on its way', async () => {
        const first = deferred()
        const second = deferred()
        books.fetchAll.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
        const store = useBooksStore()

        const older = store.fetchBooks({ page: 1, limit: 12 })
        store.fetchBooks({ page: 2, limit: 12 })
        first.reject({ code: 'INTERNAL' })
        await older.catch(() => {})

        expect(store.loading).toBe(true)
        expect(store.error).toBeNull()
    })

    it('keeps the error object of the latest request', async () => {
        books.fetchAll.mockRejectedValue({ code: 'INTERNAL', message: 'Internal server error' })
        const store = useBooksStore()

        await expect(store.fetchBooks({ page: 1, limit: 12 })).rejects.toEqual(
            expect.objectContaining({ code: 'INTERNAL' })
        )

        expect(store.error.code).toBe('INTERNAL')
        expect(store.loading).toBe(false)
    })

    it('loads the latest books without touching the catalogue list', async () => {
        books.fetchAll.mockResolvedValue(page([book('b9', 'Babička')], { page: 1, limit: 4, total: 24, pages: 6 }))
        const store = useBooksStore()
        store.$patch({ books: [{ id: 'kept', title: 'Kept' }], page: 2 })

        const latest = await store.fetchLatest(4)

        expect(books.fetchAll).toHaveBeenCalledWith({ page: 1, limit: 4 })
        expect(latest.map((b) => [b.id, b.author.name])).toEqual([['b9', 'Božena Němcová']])
        expect(store.books).toEqual([{ id: 'kept', title: 'Kept' }])
        expect(store.page).toBe(2)
    })
})
