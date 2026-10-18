import { describe, expect, it } from 'vitest'
import { can } from './capabilities'

describe('can', () => {
    it('admin can use the admin area', () => {
        expect(can('admin', 'admin')).toBe(true)
    })

    it.each(['user', 'moderator', undefined, null])('%s cannot use the admin area', (role) => {
        expect(can(role, 'admin')).toBe(false)
    })

    it('an unknown capability is never granted', () => {
        expect(can('admin', 'everything')).toBe(false)
        expect(can('admin', 'toString')).toBe(false)
    })
})
