import { createI18n } from 'vue-i18n'

const defaultLoaders = {
    cs: () => import('./locales/cs.json'),
    en: () => import('./locales/en.json'),
}

export function createLocaleRuntime({ loaders = defaultLoaders } = {}) {
    const i18n = createI18n({
        legacy: false,
        globalInjection: true,
        locale: 'cs',
        fallbackLocale: false,
        messages: {},
    })
    const loaded = new Set()
    const pending = new Map()

    function assertSupported(requested) {
        if (requested !== 'cs' && requested !== 'en') throw new Error('Unsupported locale: ' + requested)
    }

    async function loadLocale(requested) {
        assertSupported(requested)
        if (loaded.has(requested)) return
        if (!pending.has(requested)) {
            const loading = Promise.resolve()
                .then(() => loaders[requested]())
                .then((module) => {
                    i18n.global.setLocaleMessage(requested, module.default)
                    loaded.add(requested)
                })
                .finally(() => pending.delete(requested))
            pending.set(requested, loading)
        }
        await pending.get(requested)
    }

    function activateLocale(requested) {
        assertSupported(requested)
        if (!loaded.has(requested)) throw new Error('Locale not loaded: ' + requested)
        i18n.global.locale.value = requested
    }

    return {
        i18n,
        locale: i18n.global.locale,
        loadLocale,
        activateLocale,
        t: (key, params) => i18n.global.t(key, params),
    }
}

export const { i18n, locale, loadLocale, activateLocale, t } = createLocaleRuntime()
