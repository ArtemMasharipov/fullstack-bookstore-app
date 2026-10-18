import { describe, expect, it } from 'vitest'
import { canonicalCatalogQuery, catalogQuery, parseCatalogQuery, toBooksParams } from './catalogQuery'

describe('parseCatalogQuery', () => {
    it.each([
        [{}, { page: 1, q: '', category: '' }],
        [{ page: '2' }, { page: 2, q: '', category: '' }],
        [{ page: 'abc' }, { page: 1, q: '', category: '' }],
        [{ page: '0' }, { page: 1, q: '', category: '' }],
        [{ page: '1.5' }, { page: 1, q: '', category: '' }],
        [{ page: '-1' }, { page: 1, q: '', category: '' }],
        [{ page: ['2', '3'] }, { page: 1, q: '', category: '' }],
        [{ page: '9007199254740992' }, { page: 1, q: '', category: '' }],
        [{ q: ' a ' }, { page: 1, q: '', category: '' }],
        [{ q: ' Čapek ' }, { page: 1, q: 'Čapek', category: '' }],
        [{ q: 'x'.repeat(100) }, { page: 1, q: 'x'.repeat(100), category: '' }],
        [{ q: 'x'.repeat(101) }, { page: 1, q: '', category: '' }],
        [{ category: 'Science Fiction' }, { page: 1, q: '', category: 'Science Fiction' }],
        [{ category: 'x'.repeat(51) }, { page: 1, q: '', category: '' }],
        [{ category: ['a', 'b'] }, { page: 1, q: '', category: '' }],
    ])('reads %j as %j', (query, expected) => {
        expect(parseCatalogQuery(query)).toEqual(expected)
    })
})

describe('catalogQuery', () => {
    it('leaves out the first page and empty values', () => {
        expect(catalogQuery({ page: 1, q: '', category: 'Fiction' })).toEqual({ category: 'Fiction' })
    })

    it('writes a later page as a string', () => {
        expect(catalogQuery({ page: 3, q: 'Čapek', category: '' })).toEqual({ page: '3', q: 'Čapek' })
    })
})

describe('canonicalCatalogQuery', () => {
    it('answers null for an address that is already canonical', () => {
        expect(canonicalCatalogQuery({ page: '2', category: 'Fiction' })).toBeNull()
        expect(canonicalCatalogQuery({})).toBeNull()
    })

    it.each([
        [{ page: '1' }, {}],
        [{ page: 'abc', q: 'Čapek' }, { q: 'Čapek' }],
        [{ page: '2', utm: 'x' }, { page: '2' }],
        [{ q: ' Čapek ' }, { q: 'Čapek' }],
        [{ q: 'a' }, {}],
    ])('rewrites %j as %j', (query, expected) => {
        expect(canonicalCatalogQuery(query)).toEqual(expected)
    })
})

describe('toBooksParams', () => {
    it('asks for a page of 12 with the search and the category it has', () => {
        expect(toBooksParams({ page: 2, q: 'Čapek', category: '' })).toEqual({ page: 2, limit: 12, search: 'Čapek' })
        expect(toBooksParams({ page: 1, q: '', category: 'Fiction' })).toEqual({
            page: 1,
            limit: 12,
            category: 'Fiction',
        })
    })
})
