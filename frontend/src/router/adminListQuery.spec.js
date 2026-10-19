import { describe, expect, it } from 'vitest'
import { ADMIN_PAGE_SIZES, canonicalListQuery, listQuery, parseListQuery, toListParams } from './adminListQuery'

// The books screen's list: its sort keys, its default and its two filters
const CONFIG = {
    sorts: ['-createdAt', 'title', '-title', 'price', '-price'],
    defaultSort: '-createdAt',
    filters: {
        category: (value) => ['Fiction', 'History'].includes(value),
        inStock: (value) => value === 'true' || value === 'false',
    },
}
const DEFAULTS = { page: 1, limit: 10, sortBy: '-createdAt', q: '', filters: {} }

describe('admin list state in the address', () => {
    it('removes a search from an address for a list that does not support search', () => {
        const config = { ...CONFIG, search: false }
        expect(canonicalListQuery({ page: '2', q: 'unsupported' }, config)).toEqual({ page: '2' })
        expect(toListParams(parseListQuery({ q: 'unsupported' }, config))).not.toHaveProperty('search')
    })
    it('offers 10, 20 and 50 rows per page', () => {
        expect(ADMIN_PAGE_SIZES).toEqual([10, 20, 50])
    })

    it('reads a full address', () => {
        expect(
            parseListQuery(
                { page: '2', limit: '20', sortBy: 'price', q: ' Čapek ', category: 'History', inStock: 'false' },
                CONFIG
            )
        ).toEqual({
            page: 2,
            limit: 20,
            sortBy: 'price',
            q: 'Čapek',
            filters: { category: 'History', inStock: 'false' },
        })
    })

    it.each([
        { page: '0' },
        { page: 'abc' },
        { page: '0x10' },
        { page: ['2', '3'] },
        { limit: '15' },
        { limit: '1e1' },
        { sortBy: '__v' },
        { q: ' ' },
        { q: 'x'.repeat(101) },
        { category: 'Poetry' },
        { inStock: 'yes' },
        { unknown: '1' },
    ])('reads %j as the defaults', (query) => {
        expect(parseListQuery(query, CONFIG)).toEqual(DEFAULTS)
    })

    it('writes the defaults as no parameters', () => {
        expect(listQuery(DEFAULTS, CONFIG)).toEqual({})
    })

    it('writes every other value as a string', () => {
        expect(
            listQuery({ page: 2, limit: 20, sortBy: 'price', q: 'Čapek', filters: { inStock: 'false' } }, CONFIG)
        ).toEqual({ page: '2', limit: '20', sortBy: 'price', q: 'Čapek', inStock: 'false' })
    })

    it('tells a canonical address from one to replace', () => {
        expect(canonicalListQuery({}, CONFIG)).toBeNull()
        expect(canonicalListQuery({ page: '2', q: 'Čapek' }, CONFIG)).toBeNull()
        expect(canonicalListQuery({ page: '1', limit: '10' }, CONFIG)).toEqual({})
        expect(canonicalListQuery({ page: '2', limit: '15', sortBy: '__v' }, CONFIG)).toEqual({ page: '2' })
        expect(canonicalListQuery({ q: ' Čapek ' }, CONFIG)).toEqual({ q: 'Čapek' })
    })

    it('turns the state into the API parameters', () => {
        expect(toListParams(DEFAULTS)).toEqual({ page: 1, limit: 10, sortBy: '-createdAt' })
        expect(
            toListParams({ page: 2, limit: 20, sortBy: 'price', q: 'Čapek', filters: { inStock: 'false' } })
        ).toEqual({ page: 2, limit: 20, sortBy: 'price', search: 'Čapek', inStock: 'false' })
    })
})
