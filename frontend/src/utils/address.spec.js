import { describe, expect, it } from 'vitest'
import { validateAddress } from './address'

const valid = {
    fullName: 'Jan Novák',
    line1: 'Vodičkova 12',
    city: 'Praha',
    postalCode: '110 00',
    country: 'CZ',
    phone: '+420 777 123 456',
}
const errorsWith = (change) => validateAddress({ ...valid, ...change })

describe('validateAddress', () => {
    it('accepts a complete Czech address', () => {
        expect(validateAddress(valid)).toEqual({})
    })

    it.each([
        ['a postal code without a space', { postalCode: '11000' }],
        ['a phone without the prefix', { phone: '777123456' }],
        ['a phone without spaces', { phone: '+420777123456' }],
        ['surrounding spaces', { fullName: '  Jan Novák  ', city: ' Praha ' }],
    ])('accepts %s', (_, change) => {
        expect(errorsWith(change)).toEqual({})
    })

    it.each([
        ['an empty name', { fullName: '   ' }, { fullName: 'required' }],
        ['a one-letter name', { fullName: 'J' }, { fullName: 'too_small' }],
        ['a name over 100 characters', { fullName: 'J'.repeat(101) }, { fullName: 'too_big' }],
        ['a two-letter street', { line1: 'Ab' }, { line1: 'too_small' }],
        ['a street over 200 characters', { line1: 'A'.repeat(201) }, { line1: 'too_big' }],
        ['a one-letter city', { city: 'P' }, { city: 'too_small' }],
        ['a line break in the city', { city: 'Pra\nha' }, { city: 'invalid_format' }],
        ['a NUL in the street', { line1: 'Vodičkova\u000012' }, { line1: 'invalid_format' }],
        ['a four-digit postal code', { postalCode: '1100' }, { postalCode: 'invalid_format' }],
        ['a postal code with letters', { postalCode: '110 AB' }, { postalCode: 'invalid_format' }],
        ['a five-digit phone', { phone: '12345' }, { phone: 'invalid_format' }],
        ['a foreign prefix', { phone: '+421 777 123 456' }, { phone: 'invalid_format' }],
        ['another country', { country: 'SK' }, { country: 'invalid_value' }],
        ['a missing phone', { phone: undefined }, { phone: 'required' }],
    ])('rejects %s', (_, change, expected) => {
        expect(errorsWith(change)).toEqual(expected)
    })
})
