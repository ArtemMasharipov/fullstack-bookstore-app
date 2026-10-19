import { describe, expect, it } from 'vitest'
import { canonicalListQuery, listQuery, parseListQuery, toListParams } from '@/router/adminListQuery'
import { ORDERS_LIST, USERS_LIST } from './adminListConfig'

describe('user and order list addresses', () => {
    it.each(['createdAt', '-createdAt', 'username', '-username', 'email', '-email', 'lastLogin', '-lastLogin'])(
        'keeps the supported user sort %s with its filters',
        (sortBy) => {
            const state = parseListQuery({ sortBy, role: 'admin', isActive: 'false', q: 'Jan', page: '2' }, USERS_LIST)
            expect(toListParams(state)).toEqual({
                sortBy,
                role: 'admin',
                isActive: 'false',
                search: 'Jan',
                page: 2,
                limit: 10,
            })
        }
    )
    it('roundtrips an order address with only supported server parameters', () => {
        const query = { page: '2', limit: '20', sortBy: 'createdAt', status: 'delivered', paymentStatus: 'refunded' }
        const state = parseListQuery(query, ORDERS_LIST)
        expect(listQuery(state, ORDERS_LIST)).toEqual(query)
        expect(toListParams(state)).toEqual({
            page: 2,
            limit: 20,
            sortBy: 'createdAt',
            status: 'delivered',
            paymentStatus: 'refunded',
        })
        expect(canonicalListQuery({ ...query, q: 'unsupported', extra: '1' }, ORDERS_LIST)).toEqual(query)
    })
    it('discards unsupported roles, booleans and order states', () => {
        expect(canonicalListQuery({ role: 'moderator', isActive: '0' }, USERS_LIST)).toEqual({})
        expect(canonicalListQuery({ status: 'lost', paymentStatus: 'pending', sortBy: 'email' }, ORDERS_LIST)).toEqual(
            {}
        )
    })
})
