/**
 * Shipping address rules, the same as the server's. Codes are the server's
 * too (zod), so a field shows one message whichever side found the problem;
 * "required" is the client's name for an empty field.
 */

const NO_CONTROL_CHARACTERS = /^[^\p{Cc}]*$/u

export const ADDRESS_RULES = Object.freeze({
    fullName: { min: 2, max: 100 },
    line1: { min: 3, max: 200 },
    city: { min: 2, max: 100 },
    postalCode: { pattern: /^\d{3} ?\d{2}$/ },
    phone: { pattern: /^(\+420)? ?\d{3} ?\d{3} ?\d{3}$/ },
})

export const SHIPPING_COUNTRY = 'CZ'

function problemOf(value, { min, max, pattern }) {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return 'required'
    if (min !== undefined && text.length < min) return 'too_small'
    if (max !== undefined && text.length > max) return 'too_big'
    if (pattern && !pattern.test(text)) return 'invalid_format'
    if (!NO_CONTROL_CHARACTERS.test(text)) return 'invalid_format'
    return null
}

/**
 * @returns {Record<string, string>} the broken fields and their codes; empty when valid
 */
export function validateAddress(address) {
    const errors = {}
    for (const [field, rule] of Object.entries(ADDRESS_RULES)) {
        const problem = problemOf(address[field], rule)
        if (problem) errors[field] = problem
    }
    if (address.country !== SHIPPING_COUNTRY) errors.country = 'invalid_value'
    return errors
}
