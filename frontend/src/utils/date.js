import { locale, t } from '@/i18n'

const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }
const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/
const timestampPattern = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/

function calendarDate(value) {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(0)
    date.setUTCFullYear(year, month - 1, day)
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null
}

function parseDate(value) {
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? { date: value, dateOnly: false } : null
    if (typeof value !== 'string') return null
    if (dateOnlyPattern.test(value)) {
        const date = calendarDate(value)
        return date ? { date, dateOnly: true } : null
    }
    const timestamp = value.match(timestampPattern)
    if (!timestamp || !calendarDate(value.slice(0, 10))) return null
    if (Number(timestamp[1]) > 23 || Number(timestamp[2]) > 59 || Number(timestamp[3] || 0) > 59) return null
    const date = new Date(value)
    return Number.isFinite(date.getTime()) ? { date, dateOnly: false } : null
}

function format(value, language, withTime) {
    const parsed = parseDate(value)
    if (!parsed) return t('common.notAvailable')
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'cs-CZ', {
        ...dateOptions,
        ...(withTime && !parsed.dateOnly ? { hour: '2-digit', minute: '2-digit' } : {}),
        timeZone: parsed.dateOnly ? 'UTC' : 'Europe/Prague',
    }).format(parsed.date)
}

/** Date-only values retain their calendar day; timestamps use Europe/Prague. */
export function formatDate(value, language = locale.value) {
    return format(value, language, false)
}

/** Date-only values do not acquire an invented time. */
export function formatDateTime(value, language = locale.value) {
    return format(value, language, true)
}
