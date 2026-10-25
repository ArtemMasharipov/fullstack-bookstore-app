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

/** Format a server amount in minor units (geller); anything but an integer is not an amount. */
export function formatMoney(amount, currency = CURRENCY_CODE, language = locale.value) {
    if (!Number.isInteger(amount)) return t('common.notAvailable')
    return currencyFormat(language, currency).format(amount / 100)
}
