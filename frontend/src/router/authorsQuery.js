/**
 * The public author list's state in its address, as the catalogue keeps its own (catalogQuery.js). The page and the
 * search define the list, so both live in the URL: a reload, Back and a shared link show the same authors.
 *
 *   ?page=2      the page; the first page has no parameter
 *   ?q=Čapek     the search, 2 to 100 characters (sent to the API as `search`)
 *
 * The limits are the API's: a value it would refuse reads as absent, so no address shows a validation error.
 */

export const AUTHORS_PAGE_SIZE = 12

const MIN_SEARCH = 2
export const MAX_SEARCH = 100

// A repeated parameter (?q=a&q=b) arrives as an array: it is no value
const single = (value) => (typeof value === 'string' ? value.trim() : '')

/** The author list state of a route query; anything that is not a valid value reads as absent */
export function parseAuthorsQuery(query) {
    const page = single(query.page)
    const q = single(query.q)
    return {
        page: /^\d+$/.test(page) && Number.isSafeInteger(Number(page)) && Number(page) >= 1 ? Number(page) : 1,
        q: q.length >= MIN_SEARCH && q.length <= MAX_SEARCH ? q : '',
    }
}

/** The canonical route query of an author list state: no first page, no empty search */
export function authorsQuery({ page, q }) {
    return {
        ...(page > 1 && { page: String(page) }),
        ...(q && { q }),
    }
}

/** The canonical form of a route query, or null when the query already is canonical */
export function canonicalAuthorsQuery(query) {
    const canonical = authorsQuery(parseAuthorsQuery(query))
    const keys = Object.keys(query)
    const same = keys.length === Object.keys(canonical).length && keys.every((key) => canonical[key] === query[key])
    return same ? null : canonical
}

/**
 * The GET /authors parameters of an author list state. The order is the server's default (newest first, ties by
 * id, so the pages stay stable): its name sorts compare bytes and would put Čapek after Zola
 */
export function toAuthorsParams({ page, q }) {
    return {
        page,
        limit: AUTHORS_PAGE_SIZE,
        ...(q && { search: q }),
    }
}
