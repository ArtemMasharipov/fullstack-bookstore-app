import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { createLocaleRuntime } from './index'
import enMessages from './locales/en.json'
import csMessages from './locales/cs.json'
import { startWithLocaleRetry } from './bootstrap'

const messages = (ready) => ({ default: { common: { ready, greeting: 'Hello, {name}!' } } })
const loaders = () => ({
    cs: vi.fn(async () => messages('Připraveno')),
    en: vi.fn(async () => messages('Ready')),
})
const deferred = () => {
    let resolve, reject
    const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

describe('locale runtime', () => {
    it('loads only the requested locale and caches successful registration', async () => {
        const source = loaders()
        const runtime = createLocaleRuntime({ loaders: source })
        await runtime.loadLocale('en')
        await runtime.loadLocale('en')
        expect(source.cs).not.toHaveBeenCalled()
        expect(source.en).toHaveBeenCalledTimes(1)
        runtime.activateLocale('en')
        expect(runtime.t('common.ready')).toBe('Ready')
        expect(runtime.t('common.greeting', { name: 'Ada' })).toBe('Hello, Ada!')
    })

    it('deduplicates pending loads and registers the resulting messages', async () => {
        const pending = deferred()
        const source = { ...loaders(), en: vi.fn(() => pending.promise) }
        const runtime = createLocaleRuntime({ loaders: source })
        const first = runtime.loadLocale('en')
        const second = runtime.loadLocale('en')
        await Promise.resolve()
        expect(source.en).toHaveBeenCalledTimes(1)
        pending.resolve(messages('Ready'))
        await Promise.all([first, second])
        runtime.activateLocale('en')
        expect(runtime.t('common.ready')).toBe('Ready')
    })

    it('allows a fresh load after rejection', async () => {
        const source = loaders()
        source.en.mockRejectedValueOnce(new Error('offline'))
        const runtime = createLocaleRuntime({ loaders: source })
        await expect(runtime.loadLocale('en')).rejects.toThrow('offline')
        await runtime.loadLocale('en')
        expect(source.en).toHaveBeenCalledTimes(2)
        runtime.activateLocale('en')
        expect(runtime.t('common.ready')).toBe('Ready')
    })

    it('does not activate or change document language when loads complete out of order', async () => {
        const pending = deferred()
        const runtime = createLocaleRuntime({ loaders: { ...loaders(), en: () => pending.promise } })
        const englishLoad = runtime.loadLocale('en')
        await runtime.loadLocale('cs')
        runtime.activateLocale('cs')
        const previousLang = document.documentElement.lang
        pending.resolve(messages('Ready'))
        await englishLoad
        expect(runtime.locale.value).toBe('cs')
        expect(runtime.t('common.ready')).toBe('Připraveno')
        expect(document.documentElement.lang).toBe(previousLang)
    })

    it('rejects unsupported locales before calling any loader', async () => {
        const source = loaders()
        const runtime = createLocaleRuntime({ loaders: source })
        for (const unsupported of ['fr', 'toString']) {
            await expect(runtime.loadLocale(unsupported)).rejects.toThrow(/unsupported locale/i)
            expect(() => runtime.activateLocale(unsupported)).toThrow(/unsupported locale/i)
        }
        expect(source.cs).not.toHaveBeenCalled()
        expect(source.en).not.toHaveBeenCalled()
    })

    it('cannot activate a locale until its messages are registered', async () => {
        const pending = deferred()
        const runtime = createLocaleRuntime({ loaders: { ...loaders(), en: () => pending.promise } })
        const load = runtime.loadLocale('en')
        expect(() => runtime.activateLocale('en')).toThrow(/not loaded/i)
        pending.resolve(messages('Ready'))
        await load
        runtime.activateLocale('en')
        expect(runtime.locale.value).toBe('en')
    })

    it('updates reactive translations only on explicit activation', async () => {
        const runtime = createLocaleRuntime({ loaders: loaders() })
        await runtime.loadLocale('cs')
        const label = computed(() => runtime.t('common.ready'))
        expect(label.value).toBe('Připraveno')
        await runtime.loadLocale('en')
        expect(label.value).toBe('Připraveno')
        runtime.activateLocale('en')
        expect(label.value).toBe('Ready')
    })

    it('keeps successful and active locale state isolated between factories', async () => {
        const source = loaders()
        const first = createLocaleRuntime({ loaders: source })
        const second = createLocaleRuntime({ loaders: source })
        await first.loadLocale('en')
        first.activateLocale('en')
        expect(second.locale.value).toBe('cs')
        expect(() => second.activateLocale('en')).toThrow(/not loaded/i)
        await second.loadLocale('en')
        expect(source.en).toHaveBeenCalledTimes(2)
    })
})

describe('locale bootstrap', () => {
    afterEach(() => document.body.replaceChildren())

    it.each([
        ['en', 'Could not load the language. Try again.', 'Retry'],
        ['cs', 'Jazyk se nepodařilo načíst. Zkuste to znovu.', 'Zkusit znovu'],
    ])('offers a focused native retry for failed %s and starts once', async (locale, copy, retryLabel) => {
        const target = document.createElement('main')
        document.body.append(target)
        const retryLoad = deferred()
        const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockReturnValue(retryLoad.promise)
        const start = vi.fn(() => target.replaceChildren(document.createTextNode('Started')))
        const boot = startWithLocaleRetry({ locale, load, start, target })
        await vi.waitFor(() => expect(target.querySelector('[role="alert"]')?.textContent ?? '').toContain(copy))
        expect(target.querySelector('[role="alert"]').lang).toBe(locale)
        const retry = target.querySelector('button')
        expect(retry).toBeInstanceOf(HTMLButtonElement)
        expect(retry.type).toBe('button')
        expect(retry.textContent).toBe(retryLabel)
        expect(retry.disabled).toBe(false)
        expect(document.activeElement).toBe(retry)
        expect(start).not.toHaveBeenCalled()
        retry.click()
        retry.click()
        await vi.waitFor(() => expect(load).toHaveBeenCalledTimes(2))
        expect(load.mock.calls).toEqual([[locale], [locale]])
        retryLoad.resolve()
        await boot
        expect(start).toHaveBeenCalledTimes(1)
        expect(target.textContent).toBe('Started')
        expect(target.querySelector('[role="alert"]')).toBeNull()
    })

    it('waits for the requested locale before starting on first success', async () => {
        const pending = deferred()
        const target = document.createElement('main')
        const start = vi.fn()
        const load = vi.fn(() => pending.promise)
        const boot = startWithLocaleRetry({ locale: 'en', load, start, target })
        expect(start).not.toHaveBeenCalled()
        pending.resolve()
        await boot
        expect(load).toHaveBeenCalledWith('en')
        expect(start).toHaveBeenCalledTimes(1)
        expect(target.querySelector('button')).toBeNull()
    })

    it('propagates start errors instead of offering a duplicate mount', async () => {
        const target = document.createElement('main')
        const start = vi.fn(() => {
            throw new Error('mount failed')
        })
        await expect(startWithLocaleRetry({ locale: 'en', load: async () => {}, start, target })).rejects.toThrow(
            'mount failed'
        )
        expect(start).toHaveBeenCalledTimes(1)
        expect(target.querySelector('[role="alert"]')).toBeNull()
    })
})

describe('default locale asset loader', () => {
    afterEach(() => vi.unstubAllGlobals())

    it('retries a failed requested dictionary fetch without loading the inactive language', async () => {
        const requests = []
        let fail = true
        vi.stubGlobal('fetch', async (url, options) => {
            const path = new URL(url, 'http://localhost').pathname
            requests.push({ path, options })
            if (!path.endsWith('/en.json')) throw new Error('Unexpected inactive dictionary request')
            const response = new Response(JSON.stringify(enMessages), { status: fail ? 503 : 200 })
            fail = false
            return response
        })
        const runtime = createLocaleRuntime()
        await expect(runtime.loadLocale('en')).rejects.toThrow()
        expect(runtime.i18n.global.availableLocales).toEqual([])
        expect(runtime.locale.value).toBe('cs')
        await runtime.loadLocale('en')
        runtime.activateLocale('en')
        expect(runtime.t('routes.Books')).toBe('Books')
        await runtime.loadLocale('en')
        expect(requests).toEqual([
            { path: '/src/i18n/locales/en.json', options: undefined },
            { path: '/src/i18n/locales/en.json', options: undefined },
        ])
    })

    it('fetches only CS on first load and requests EN when it is explicitly loaded', async () => {
        const requests = []
        vi.stubGlobal('fetch', async (url) => {
            const path = new URL(url, 'http://localhost').pathname
            requests.push(path)
            if (path.endsWith('/cs.json')) return new Response(JSON.stringify(csMessages), { status: 200 })
            if (path.endsWith('/en.json')) return new Response(JSON.stringify(enMessages), { status: 200 })
            throw new Error('Unexpected dictionary URL')
        })
        const runtime = createLocaleRuntime()
        await runtime.loadLocale('cs')
        runtime.activateLocale('cs')
        expect(runtime.t('routes.Books')).toBe('Knihy')
        expect(requests).toEqual(['/src/i18n/locales/cs.json'])
        await runtime.loadLocale('en')
        expect(runtime.locale.value).toBe('cs')
        runtime.activateLocale('en')
        expect(runtime.t('routes.Books')).toBe('Books')
        expect(requests).toEqual(['/src/i18n/locales/cs.json', '/src/i18n/locales/en.json'])
    })
})
