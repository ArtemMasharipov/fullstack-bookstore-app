import * as localeRuntime from '@/i18n'
import { localeRoute } from './locale'

// Pages that make no sense to return to after signing in
const REFUSED = new Set(['NotFound', 'Login', 'Register'])
// A backslash turns "/\host" into "//host" in browsers; control characters have no place in a path
const UNSAFE = /[\\\p{Cc}]/u

/**
 * The page to open after signing in. `value` comes from ?redirect, so anyone
 * can write it: only a path inside this app that names one of its pages is
 * accepted, and it opens in the given language.
 * @returns {object|null} a route location, or null when the value is refused
 */
export function redirectTarget(router, value, locale = localeRuntime.locale.value) {
    if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || UNSAFE.test(value)) {
        return null
    }
    const { name, params, query, hash } = router.resolve(value)
    if (!name || REFUSED.has(name)) return null
    return localeRoute(name, { params, query, hash }, locale)
}

/** The sign-in page; `redirect` is the path to return to afterwards */
export function loginRoute(redirect, locale = localeRuntime.locale.value) {
    return localeRoute('Login', redirect === undefined ? {} : { query: { redirect } }, locale)
}

/** Opens the page the visitor came to sign in for, or Home */
export function afterSignIn(router, route) {
    return router.push(redirectTarget(router, route.query.redirect) ?? localeRoute('Home'))
}
