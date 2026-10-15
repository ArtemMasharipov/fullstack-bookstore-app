import { locale, t } from '@/i18n'

export const CURRENCY_CODE = 'CZK'

const currencyFormat = (language, currency) =>
    new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'cs-CZ', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

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
