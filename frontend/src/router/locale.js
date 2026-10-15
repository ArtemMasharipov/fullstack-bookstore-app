import * as localeRuntime from '@/i18n'

export function routeLocale(route) {
    return route.params?.locale === 'en' ? 'en' : 'cs'
}

export function localeRoute(name, { params = {}, query, hash } = {}, locale = localeRuntime.locale.value) {
    return {
        name,
        params: { ...params, locale: locale === 'en' ? 'en' : '' },
        ...(query === undefined ? {} : { query }),
        ...(hash === undefined ? {} : { hash }),
    }
}

export function switchLocaleTarget(route, locale) {
    return localeRoute(route.name, { params: route.params, query: route.query, hash: route.hash }, locale)
}

export function installLocaleRouting(router, { onLoadError, runtime = localeRuntime } = {}) {
    let navigation = 0
    router.beforeEach(async (to) => {
        const attempt = ++navigation
        const locale = routeLocale(to)
        try {
            await runtime.loadLocale(locale)
        } catch {
            if (attempt === navigation) onLoadError?.({ locale, retry: () => router.push(to.fullPath) })
            return false
        }
    })
    router.afterEach((to, from, failure) => {
        if (failure || router.currentRoute.value !== to) return
        const locale = routeLocale(to)
        runtime.activateLocale(locale)
        document.documentElement.lang = locale
        document.title = to.meta.titleKey ? runtime.t(to.meta.titleKey) + ' | Bookstore' : 'Bookstore'
    })
}
