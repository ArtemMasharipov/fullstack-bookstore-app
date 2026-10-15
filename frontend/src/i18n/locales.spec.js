import { describe, expect, it } from 'vitest'
import cs from './locales/cs.json'
import en from './locales/en.json'

function leaves(value, prefix = '') {
    return Object.entries(value)
        .flatMap(([key, child]) => {
            const path = prefix ? `${prefix}.${key}` : key
            if (child && typeof child === 'object' && !Array.isArray(child)) return leaves(child, path)
            expect(typeof child, `${path} must be a string`).toBe('string')
            return [[path, child]]
        })
        .sort(([left], [right]) => left.localeCompare(right))
}
const params = (message) => [...message.matchAll(/\{([A-Za-z_]\w*)\}/g)].map((match) => match[1]).sort()

describe('locale dictionaries', () => {
    it('provides common, loading and bootstrap strings in both locales', () => {
        for (const dictionary of [cs, en]) {
            expect(dictionary).toHaveProperty('common.notAvailable')
            expect(dictionary).toHaveProperty('loading.language')
            expect(dictionary).toHaveProperty('bootstrap.loadError')
            expect(dictionary).toHaveProperty('bootstrap.retry')
        }
    })

    it('has matching recursive leaf keys, string values and named parameters', () => {
        const czech = leaves(cs)
        const english = leaves(en)
        expect(czech.length).toBeGreaterThan(0)
        expect(english.map(([key]) => key)).toEqual(czech.map(([key]) => key))
        english.forEach(([key, message], index) => {
            expect(params(message), key).toEqual(params(czech[index][1]))
        })
    })
})
