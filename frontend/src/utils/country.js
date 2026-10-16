import { locale } from '@/i18n'

const COUNTRY_CODE = /^[A-Z]{2}$/

/**
 * A delivery country as people read it: a code is named in the active language
 * ("CZ" → "Česko", "Czechia"); older orders stored the country as text, which
 * stays as it was.
 */
export function formatCountry(value, language = locale.value) {
    if (!value) return ''
    if (!COUNTRY_CODE.test(value)) return value
    return new Intl.DisplayNames([language], { type: 'region' }).of(value) ?? value
}
