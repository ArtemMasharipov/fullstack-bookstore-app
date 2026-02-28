/**
 * Unified navigation guard — single beforeEach replacing auth, admin, and guest guards.
 *
 * Access rules are read from `to.meta.access` (set by buildRoutes):
 *   access.auth        — route requires an authenticated user
 *   access.guestOnly   — redirect to Home if the user is already logged in
 *   access.permission  — user must pass authStore.hasPermission(permission)
 *
 * Scenarios handled (in order):
 *   1. Public route  → pass through immediately (no token validation)
 *   2. Auth required → validate token; redirect to Login if invalid/missing
 *   3. Guest-only    → redirect to Home if already authenticated
 *   4. Permission    → redirect to Unauthorized if check fails
 */

import { useAuthStore } from '@/stores/auth'
import { ROUTE_NAMES } from '@/utils/constants/routes'

const unifiedGuard = async (to, from, next) => {
    const { access = {} } = to.meta ?? {}

    // Fast path: fully public route — skip all auth checks.
    if (!access.auth && !access.guestOnly && !access.permission) {
        return next()
    }

    const authStore = useAuthStore()
    let isAuthenticated = authStore.isAuthenticated

    // Validate the stored token only when auth state matters for this route.
    if (isAuthenticated) {
        try {
            const isValid = await authStore.checkAuthStatus()
            if (!isValid) isAuthenticated = false
        } catch {
            isAuthenticated = false
        }
    }

    // 1. Route requires authentication.
    if (access.auth && !isAuthenticated) {
        localStorage.setItem('redirectPath', to.fullPath)
        return next({ name: ROUTE_NAMES.LOGIN })
    }

    // 2. Route is guest-only (Login / Register).
    if (access.guestOnly && isAuthenticated) {
        return next({ name: ROUTE_NAMES.HOME })
    }

    // 3. Route requires a specific permission.
    if (access.permission && !authStore.hasPermission(access.permission)) {
        return next({ name: ROUTE_NAMES.UNAUTHORIZED })
    }

    next()
}

export default unifiedGuard
