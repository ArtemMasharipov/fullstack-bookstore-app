import { locale, t } from '@/i18n'

export const CURRENCY_CODE = 'CZK'

/** Format finite numeric amounts in major CZK units without changing their value. */
export function formatPrice(price, language = locale.value) {
    if (typeof price !== 'number' || !Number.isFinite(price)) return t('common.notAvailable')
    return new Intl.NumberFormat(language === 'en' ? 'en-GB' : 'cs-CZ', {
        style: 'currency',
        currency: CURRENCY_CODE,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(price)
}
