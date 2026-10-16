import { describe, expect, it } from 'vitest'
import { formatCountry } from './country'

describe('formatCountry', () => {
    it('names a country code in the active language', () => {
        expect(formatCountry('CZ', 'cs')).toBe('Česko')
        expect(formatCountry('CZ', 'en')).toBe('Czechia')
    })

    it('keeps the stored text of older orders', () => {
        expect(formatCountry('Ukraine', 'en')).toBe('Ukraine')
    })

    it('shows nothing for a missing value', () => {
        expect(formatCountry(undefined)).toBe('')
        expect(formatCountry(null, 'en')).toBe('')
    })
})
