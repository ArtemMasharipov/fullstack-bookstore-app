import { AxiosError } from 'axios'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ERROR_CODES, resolveErrorKey } from './errorResolver'
import { AppError, ErrorHandler, ERROR_TYPES } from './errorHandler'
import { activateLocale, loadLocale } from '@/i18n'
import en from '@/i18n/locales/en.json'
import cs from '@/i18n/locales/cs.json'
beforeAll(async () => {
    vi.stubGlobal('fetch', async (url) => new Response(JSON.stringify(String(url).includes('/en.json') ? en : cs)))
    await loadLocale('cs')
    await loadLocale('en')
    activateLocale('en')
})
afterAll(() => vi.unstubAllGlobals())

describe('safe error code resolution', () => {
    const codes = [
        'VALIDATION_FAILED',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'PRICE_CHANGED',
        'UNPROCESSABLE',
        'RATE_LIMITED',
        'INTERNAL',
    ]
    it.each(codes)('resolves stable %s from each supported boundary', (code) => {
        expect(ERROR_CODES).toContain(code)
        for (const error of [{ code }, { response: { data: { error: { code } } } }, { data: { error: { code } } }]) {
            expect(resolveErrorKey(error)).toBe('errors.' + code)
        }
    })
    it.each([
        null,
        undefined,
        'private sentinel',
        {},
        { code: 'NETWORK_ERROR' },
        { code: 'toString' },
        { code: ['NOT_FOUND'] },
        { status: 404, message: 'private sentinel' },
        { response: { status: 404, data: { message: 'private sentinel', error: null } } },
    ])('safely falls back for %j', (error) => {
        expect(resolveErrorKey(error)).toBe('errors.UNKNOWN')
    })
    it('keeps transformed HTTP metadata without classifying it as a network failure', () => {
        const data = { error: { code: 'INTERNAL', message: 'private sentinel' } }
        const error = Object.assign(new Error('private sentinel'), { status: 500, data, code: 'INTERNAL' })
        const result = ErrorHandler.normalizeError(error)
        expect(result.type).toBe(ERROR_TYPES.SERVER)
        expect(result.statusCode).toBe(500)
        expect(result.details).toBe(data)
        expect(result.messageKey).toBe('errors.INTERNAL')
        expect(result.userMessage).not.toContain('private sentinel')
    })
    it('retains AppError public fields and never exposes its raw message as user copy', () => {
        const details = { field: 'email' }
        const error = new AppError('private sentinel', ERROR_TYPES.VALIDATION, 400, details)
        const result = ErrorHandler.normalizeError(error)
        expect(result).toMatchObject({
            type: ERROR_TYPES.VALIDATION,
            statusCode: 400,
            details,
            timestamp: error.timestamp,
            messageKey: 'errors.UNKNOWN',
        })
        expect(result.userMessage).not.toContain('private sentinel')
    })
})

it('resolves normalized display copy in the current language rather than freezing it at normalization', () => {
    activateLocale('en')
    const error = ErrorHandler.normalizeError({ code: 'CONFLICT', status: 409 })
    expect(error.userMessage).toContain('changed')
    activateLocale('cs')
    expect(error.userMessage).toContain('zm\u011bnila')
})

it('resolves the server whitelist code through a real Axios transport error code', () => {
    const error = new AxiosError('private sentinel', AxiosError.ERR_BAD_REQUEST, {}, null, {
        status: 409,
        data: { error: { code: 'PRICE_CHANGED' } },
        headers: {},
        config: {},
    })
    expect(resolveErrorKey(error)).toBe('errors.PRICE_CHANGED')
})
