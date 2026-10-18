/**
 * Capabilities
 * The one table of what each role may do in the UI: routes, menus and
 * components ask can(role, capability) and nothing else. The role is the one
 * the API has for the user; the API checks every request on its own, so this
 * only decides what the UI offers.
 */

export const CAPABILITIES = Object.freeze({
    // The admin area and its menu entries
    admin: Object.freeze(['admin']),
})

/** Whether a user with this role has the capability; an unknown capability is never granted */
export function can(role, capability) {
    return Object.hasOwn(CAPABILITIES, capability) && CAPABILITIES[capability].includes(role)
}
