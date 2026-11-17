import { describe, expect, it } from 'vitest'
import { canonicalAuthorsQuery, authorsQuery, parseAuthorsQuery, toAuthorsParams } from './authorsQuery'

describe('parseAuthorsQuery', () => {
    it.each([
        [{}, { page: 1, q: '' }],
        [{ page: '2' }, { page: 2, q: '' }],
        [{ page: 'abc' }, { page: 1, q: '' }],
        [{ page: '0' }, { page: 1, q: '' }],
        [{ page: '1.5' }, { page: 1, q: '' }],
        [{ page: '-1' }, { page: 1, q: '' }],
        [{ page: ['2', '3'] }, { page: 1, q: '' }],
        [{ page: '9007199254740992' }, { page: 1, q: '' }],
        [{ q: ' a ' }, { page: 1, q: '' }],
        [{ q: ' Čapek ' }, { page: 1, q: 'Čapek' }],
        [{ q: 'x'.repeat(100) }, { page: 1, q: 'x'.repeat(100) }],
        [{ q: 'x'.repeat(101) }, { page: 1, q: '' }],
        [{ q: ['Čapek', 'Hašek'] }, { page: 1, q: '' }],
    ])('reads %j as %j', (query, expected) => {
        expect(parseAuthorsQuery(query)).toEqual(expected)
    })
})

describe('authorsQuery', () => {
    it('leaves out the first page and an empty search', () => {
        expect(authorsQuery({ page: 1, q: '' })).toEqual({})
    })

    it('writes a later page as a string', () => {
        expect(authorsQuery({ page: 3, q: 'Čapek' })).toEqual({ page: '3', q: 'Čapek' })
    })
})

describe('canonicalAuthorsQuery', () => {
    it('answers null for an address that is already canonical', () => {
        expect(canonicalAuthorsQuery({ page: '2', q: 'Čapek' })).toBeNull()
        expect(canonicalAuthorsQuery({})).toBeNull()
    })

    it.each([
        [{ page: '1' }, {}],
        [{ page: 'abc', q: 'Čapek' }, { q: 'Čapek' }],
        [{ page: '2', category: 'Fiction' }, { page: '2' }],
        [{ q: ' Čapek ' }, { q: 'Čapek' }],
        [{ q: 'a' }, {}],
    ])('rewrites %j as %j', (query, expected) => {
        expect(canonicalAuthorsQuery(query)).toEqual(expected)
    })
})

describe('toAuthorsParams', () => {
    it('asks for a page of 12 in the server order with the search it has', () => {
        // No sortBy: the server's default order (newest first); its lastName sort is binary and puts Č after Z
        expect(toAuthorsParams({ page: 2, q: 'Čapek' })).toEqual({ page: 2, limit: 12, search: 'Čapek' })
        expect(toAuthorsParams({ page: 1, q: '' })).toEqual({ page: 1, limit: 12 })
    })
})
