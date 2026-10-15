/**
 * buildRoutes — converts the route manifest into Vue Router route objects.
 * buildAdminNav — extracts sidebar navigation data from the manifest.
 *
 * No route definition lives outside manifest.js; this file is pure
 * transformation logic with no business knowledge of its own.
 */

import { routeManifest } from './manifest.js'

/**
 * Recursively converts a single manifest entry into a Vue Router route object.
 * Parent `access` is merged into every child so the unified guard can read it
 * directly from `to.meta.access` without walking `to.matched`.
 *
 * @param {object} entry       - Manifest entry
 * @param {object} parentAccess - Inherited access policy from the parent layout
 * @returns {object} Vue Router route record
 */
function buildRoute(entry, parentAccess = {}) {
    const { id, path, view, layout, titleKey, access = {}, children, redirectTo } = entry

    if (redirectTo) {
        // params include the language prefix, so the target keeps the language
        return {
            path,
            name: id,
            redirect: (to) => ({ name: redirectTo, params: to.params, query: to.query }),
        }
    }

    // Child access is the parent policy overridden by the entry's own policy.
    const mergedAccess = { ...parentAccess, ...access }

    const meta = { titleKey, access: mergedAccess }

    if (children) {
        // Layout route — uses `layout` component, no name of its own.
        return {
            path,
            component: layout,
            meta,
            children: children.map((child) => buildRoute(child, mergedAccess)),
        }
    }

    return {
        path,
        name: id,
        component: view,
        meta,
    }
}

/**
 * Returns the full route array ready to pass to createRouter().
 *
 * @returns {object[]}
 */
export function buildRoutes() {
    return routeManifest.map((entry) => ({
        ...buildRoute(entry),
        path: '/:locale(en)?' + (entry.path === '/' ? '' : entry.path),
    }))
}

/**
 * Returns admin nav items grouped by section and sorted by `order`.
 * AdminSidebar imports this instead of maintaining its own hardcoded arrays.
 *
 * Shape of the return value:
 * {
 *   main:   [{ id, titleKey, icon, subtitleKey, order, to: { name } }, ...],
 *   system: [{ id, titleKey, icon, subtitleKey, order, to: { name } }, ...],
 * }
 *
 * @returns {Record<string, object[]>}
 */
export function buildAdminNav() {
    const adminEntry = routeManifest.find((e) => e.id === 'Admin')
    if (!adminEntry?.children) return {}

    /** @type {Record<string, object[]>} */
    const groups = {}

    for (const child of adminEntry.children) {
        if (!child.nav) continue
        const { section, order, icon, subtitleKey } = child.nav

        if (!groups[section]) groups[section] = []

        groups[section].push({
            id: child.id,
            titleKey: child.titleKey,
            icon,
            subtitleKey: subtitleKey ?? null,
            order,
            to: { name: child.id },
        })
    }

    for (const section of Object.keys(groups)) {
        groups[section].sort((a, b) => a.order - b.order)
    }

    return groups
}
