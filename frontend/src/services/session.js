import { useNotifications } from '@/composables/useNotifications'
import { routeLocale } from '@/router/locale'
import { loginRoute } from '@/router/redirect'
import { setUnauthorizedHandler } from '@/services/api/baseApi'
import * as stores from '@/stores'

/**
 * Session
 * Signing out and a 401 end the session the same way: the browser forgets the
 * token, the user, the cart and the notifications of that session. A page that
 * needs an account is then replaced by Login in the same language (after a 401,
 * with the way back in ?redirect); a public page stays open for the visitor as a
 * guest.
 */

// The guest cart lives under 'cart'; 'redirectPath' is left over from older versions
const SESSION_KEYS = ['token', 'userData', 'cart', 'redirectPath']
// The catalogue and the shop settings are the same for every visitor
const PUBLIC_STORES = ['books', 'authors', 'shopConfig']

let router = null

/** Forgets everything of the session without leaving the page */
export function clearSession() {
    // Before the stores: the auth store reads its token from localStorage when it resets
    for (const key of SESSION_KEYS) localStorage.removeItem(key)
    for (const useStore of Object.values(stores)) {
        const store = useStore()
        if (PUBLIC_STORES.includes(store.$id)) continue
        // A store with changes still running knows how to forget their answers
        if (typeof store.forget === 'function') store.forget()
        else store.$reset()
    }
    useNotifications().clear()
}

/**
 * Ends the session; a page that needs an account gives way to Login. After a
 * 401 or an expired token Login keeps the way back to the page; after signing
 * out it does not, or the next person on the device would land on the
 * previous user's page.
 */
export function resetSession({ wayBack = true } = {}) {
    clearSession()
    const current = router?.currentRoute.value
    if (!current?.meta.access?.auth) return Promise.resolve()
    return router.replace(loginRoute(wayBack ? current.fullPath : undefined, routeLocale(current)))
}

/** Ties the session to the app's router and to the API's 401 answers */
export function installSession(appRouter) {
    router = appRouter
    setUnauthorizedHandler(resetSession)
}
