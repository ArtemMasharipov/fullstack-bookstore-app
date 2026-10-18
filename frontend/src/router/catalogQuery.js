/**
 * The catalogue's state in its address. The page, the search and the category together define the list, so all
 * three live in the URL: a reload, Back and a shared link show the same books.
 *
 *   ?page=2      the page; the first page has no parameter
 *   ?q=Čapek     the search, at least 2 characters (sent to the API as `search`)
 *   ?category=   one category, compared as a whole value
 */

export const CATALOG_PAGE_SIZE = 12

const MIN_SEARCH = 2
const MAX_CATEGORY = 50

// A repeated parameter (?q=a&q=b) arrives as an array: it is no value
const single = (value) => (typeof value === 'string' ? value.trim() : '')

/** The catalogue state of a route query; anything that is not a valid value reads as absent */
export function parseCatalogQuery(query) {
    const page = single(query.page)
    const q = single(query.q)
    const category = single(query.category)
    return {
        page: /^\d+$/.test(page) && Number(page) >= 1 ? Number(page) : 1,
        q: q.length >= MIN_SEARCH ? q : '',
        category: category.length <= MAX_CATEGORY ? category : '',
    }
}

/** The canonical route query of a catalogue state: no first page, no empty values */
export function catalogQuery({ page, q, category }) {
    return {
        ...(page > 1 && { page: String(page) }),
        ...(q && { q }),
        ...(category && { category }),
    }
}

/** The canonical form of a route query, or null when the query already is canonical */
export function canonicalCatalogQuery(query) {
    const canonical = catalogQuery(parseCatalogQuery(query))
    const keys = Object.keys(query)
    const same = keys.length === Object.keys(canonical).length && keys.every((key) => canonical[key] === query[key])
    return same ? null : canonical
}

/** The GET /books parameters of a catalogue state */
export function toBooksParams({ page, q, category }) {
    return {
        page,
        limit: CATALOG_PAGE_SIZE,
        ...(q && { search: q }),
        ...(category && { category }),
    }
}
