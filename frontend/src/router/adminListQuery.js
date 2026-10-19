/**
 * The state of an admin table in its address, so that a reload, Back and a shared link show the same rows:
 *
 *   ?page=2        the page; the first page has no parameter
 *   ?limit=20      rows per page, one of ADMIN_PAGE_SIZES; 10 has no parameter
 *   ?sortBy=price  a sort key of the API ("-" in front: descending); the screen's default has no parameter
 *   ?q=Čapek       the search, 1 to 100 characters (sent to the API as `search`)
 *   ?category=…    the screen's filters, each a value its check accepts
 *
 * A screen describes its list as { sorts, defaultSort, filters: { name: (value) => boolean } }. A value the API would
 * refuse reads as absent, so no address shows a validation error.
 */

export const ADMIN_PAGE_SIZES = [10, 20, 50]

const DEFAULT_LIMIT = 10
const MAX_SEARCH = 100

// A repeated parameter (?q=a&q=b) arrives as an array: it is no value
const single = (value) => (typeof value === 'string' ? value.trim() : '')
const whole = (value) => (/^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : 0)

/** The list state of a route query; anything that is not a valid value reads as the default */
export function parseListQuery(query, { sorts, defaultSort, filters = {}, search = true }) {
    const page = whole(single(query.page))
    const limit = whole(single(query.limit))
    const sortBy = single(query.sortBy)
    const q = search ? single(query.q) : ''
    return {
        page: page >= 1 ? page : 1,
        limit: ADMIN_PAGE_SIZES.includes(limit) ? limit : DEFAULT_LIMIT,
        sortBy: sorts.includes(sortBy) ? sortBy : defaultSort,
        q: q.length <= MAX_SEARCH ? q : '',
        filters: Object.fromEntries(
            Object.entries(filters)
                .map(([name, accepts]) => [name, single(query[name]), accepts])
                .filter(([, value, accepts]) => value && accepts(value))
                .map(([name, value]) => [name, value])
        ),
    }
}

/** The canonical route query of a list state: no default values, no empty ones */
export function listQuery({ page, limit, sortBy, q, filters = {} }, { defaultSort }) {
    return {
        ...(page > 1 && { page: String(page) }),
        ...(limit !== DEFAULT_LIMIT && { limit: String(limit) }),
        ...(sortBy !== defaultSort && { sortBy }),
        ...(q && { q }),
        ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
    }
}

/** The canonical form of a route query, or null when the query already is canonical */
export function canonicalListQuery(query, config) {
    const canonical = listQuery(parseListQuery(query, config), config)
    const keys = Object.keys(query)
    const same = keys.length === Object.keys(canonical).length && keys.every((key) => canonical[key] === query[key])
    return same ? null : canonical
}

/** The API parameters of a list state */
export function toListParams({ page, limit, sortBy, q, filters = {} }) {
    return { page, limit, sortBy, ...(q && { search: q }), ...filters }
}
