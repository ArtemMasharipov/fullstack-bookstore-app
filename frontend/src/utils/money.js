import { locale, t } from '@/i18n'

export const CURRENCY_CODE = 'CZK'

// Locale initialization is expensive; every card and total can share the same formatter.
const currencyFormats = new Map()
const currencyFormat = (language, currency) => {
    const tag = language === 'en' ? 'en-GB' : 'cs-CZ'
    const key = `${tag}:${currency}`
    if (!currencyFormats.has(key)) {
        currencyFormats.set(
            key,
            new Intl.NumberFormat(tag, {
                style: 'currency',
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })
        )
    }
    return currencyFormats.get(key)
}

/** Format finite numeric amounts in major CZK units without changing their value. */
export function formatPrice(price, language = locale.value) {
    if (typeof price !== 'number' || !Number.isFinite(price)) return t('common.notAvailable')
    return currencyFormat(language, CURRENCY_CODE).format(price)
}

/**
 * A price someone typed in crowns ("249,90", "249.9", " 249 ") as whole geller, or null when it is not one: at most
 * six digits of crowns and two of geller, after a decimal comma or point. Read from the text, not multiplied as a
 * float, so 249,90 never becomes 24989.
 */
export function crownsToMinor(text) {
    const match = /^(\d{1,6})(?:[.,](\d{1,2}))?$/.exec(String(text ?? '').trim())
    if (!match) return null
    return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
}

/** Format a server amount in minor units (geller); anything but an integer is not an amount. */
export function formatMoney(amount, currency = CURRENCY_CODE, language = locale.value) {
    if (!Number.isInteger(amount)) return t('common.notAvailable')
    return currencyFormat(language, currency).format(amount / 100)
}
