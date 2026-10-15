import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import cs from '@/i18n/locales/cs.json'
import en from '@/i18n/locales/en.json'
import { activateLocale, loadLocale, t } from '@/i18n'
import { formatDate, formatDateTime } from './helpers'

beforeAll(async () => {
    vi.stubGlobal('fetch', async (url) => {
        const path = new URL(url, 'http://localhost').pathname
        if (path.endsWith('/cs.json')) return new Response(JSON.stringify(cs), { status: 200 })
        if (path.endsWith('/en.json')) return new Response(JSON.stringify(en), { status: 200 })
        throw new Error('Unexpected dictionary URL')
    })
    await loadLocale('cs')
    await loadLocale('en')
    vi.unstubAllGlobals()
})
beforeEach(() => activateLocale('cs'))

const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }

describe('calendar date and Prague timestamp display', () => {
    it.each(['2026-03-29', '2026-10-25', '2024-02-29'])('preserves date-only %s without inventing a time', (value) => {
        const expected = new Intl.DateTimeFormat('cs-CZ', { ...dateOptions, timeZone: 'UTC' }).format(
            new Date(value + 'T00:00:00Z')
        )
        expect(formatDate(value)).toBe(expected)
        expect(formatDateTime(value)).toBe(expected)
    })
    it.each([
        '2026-03-29T00:30:00Z',
        '2026-10-25T01:30:00Z',
        '2026-03-29T01:30:00+01:00',
        '2026-03-29T00:30:00.123456Z',
    ])('formats %s in Europe/Prague', (value) => {
        const options = { ...dateOptions, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' }
        expect(formatDateTime(value, 'en')).toBe(new Intl.DateTimeFormat('en-GB', options).format(new Date(value)))
        expect(formatDate(value, 'en')).toBe(
            new Intl.DateTimeFormat('en-GB', { ...dateOptions, timeZone: 'Europe/Prague' }).format(new Date(value))
        )
    })
    it('accepts a Date instance without mutating its instant', () => {
        const value = new Date('2026-03-28T23:30:00Z')
        expect(formatDate(value, 'en')).toBe(
            new Intl.DateTimeFormat('en-GB', { ...dateOptions, timeZone: 'Europe/Prague' }).format(value)
        )
        expect(value.toISOString()).toBe('2026-03-28T23:30:00.000Z')
    })
    it.each([
        '2026-02-30',
        '2025-02-29',
        '2026-04-31',
        '2026-02-30T10:00:00Z',
        '2026-03-29T24:00:00Z',
        '2026-03-29T25:00:00Z',
        '2026-03-29T10:00:00',
        '03/29/2026',
        '29.03.2026',
        'bad',
        null,
        undefined,
        0,
        {},
        new Date(NaN),
    ])('rejects invalid or ambiguous %s', (value) => {
        expect(formatDate(value)).toBe(t('common.notAvailable'))
        expect(formatDateTime(value)).toBe(t('common.notAvailable'))
    })
    it('updates computed date and time display after locale activation', () => {
        const value = '2026-03-29T00:30:00Z'
        const display = computed(() => formatDateTime(value))
        const options = { ...dateOptions, hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' }
        expect(display.value).toBe(new Intl.DateTimeFormat('cs-CZ', options).format(new Date(value)))
        activateLocale('en')
        expect(display.value).toBe(new Intl.DateTimeFormat('en-GB', options).format(new Date(value)))
    })
})
