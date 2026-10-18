/**
 * Unified navigation guard — single beforeEach replacing auth, admin, and guest guards.
 *
 * Access rules are read from `to.meta.access` (set by buildRoutes):
 *   access.auth        — route requires an authenticated user
 *   access.guestOnly   — redirect to Home if the user is already logged in
 *   access.capability  — the user's role must have it: can(role, capability)
 *
 * Scenarios handled (in order):
 *   1. Public route  → pass through immediately (no token validation)
 *   2. Auth required → validate token; send to Login with the way back in ?redirect if invalid/missing
 *   3. Guest-only    → redirect to Home if already authenticated
 *   4. Capability    → the role as the server has it (asked once per app load); redirect to Unauthorized without it
 */

import { can } from '@/auth/capabilities'
import { clearSession } from '@/services/session'
import { useAuthStore } from '@/stores/auth'
import { localeRoute, routeLocale } from '../locale'
import { loginRoute } from '../redirect'
import { ROUTE_NAMES } from '@/utils/constants/routes'

const unifiedGuard = async (to, from, next) => {
    const { access = {} } = to.meta ?? {}

    // Fast path: fully public route — skip all auth checks.
    if (!access.auth && !access.guestOnly && !access.capability) {
        return next()
    }

    const authStore = useAuthStore()
    let isAuthenticated = authStore.isAuthenticated

    // Validate the stored token only when auth state matters for this route.
    if (isAuthenticated) {
        try {
            isAuthenticated = await authStore.checkAuthStatus()
        } catch {
            isAuthenticated = false
        }
        // An expired or unreadable token ends the whole session, not only the token
        if (!isAuthenticated) clearSession()
    }

    // The cached role may be out of date: a capability is checked against the server's.
    // A 401 here ends the session in the API client, and the visitor is a guest below.
    if (access.capability && isAuthenticated) {
        try {
            await authStore.ensureFreshUser()
        } catch {
            // An answer with an error status; the session state below decides
        }
        isAuthenticated = authStore.isAuthenticated
    }

    // 1. Route requires authentication.
    if (access.auth && !isAuthenticated) {
        return next(loginRoute(to.fullPath, routeLocale(to)))
    }

    // 2. Route is guest-only (Login / Register).
    if (access.guestOnly && isAuthenticated) {
        return next(localeRoute(ROUTE_NAMES.HOME, {}, routeLocale(to)))
    }

    // 3. Route requires a capability.
    if (access.capability && !can(authStore.user?.role, access.capability)) {
        return next(localeRoute(ROUTE_NAMES.UNAUTHORIZED, {}, routeLocale(to)))
    }

    next()
}

export default unifiedGuard
