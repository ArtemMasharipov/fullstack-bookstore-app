import { canonicalListQuery, listQuery, parseListQuery, toListParams } from '@/router/adminListQuery'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * A page of an admin list, kept in the address (router/adminListQuery.js). The rows load whenever the address
 * changes; a wrong address is replaced with its canonical form first, and a page past the last one with the last
 * page. Only the newest answer counts: with quick paging, answers can arrive out of order.
 *
 * @param {object} options
 * @param {object} options.config - the list: { sorts, defaultSort, filters }
 * @param {(params: object) => Promise<{ data: object[], pagination: { page, limit, total, pages } }>} options.load
 */
export function useAdminList({ config, load }) {
    const route = useRoute()
    const router = useRouter()
    // The list reacts to its own route only: leaving it changes the address before the screen goes
    const name = route.name

    const state = computed(() => parseListQuery(route.query, config))
    const items = ref([])
    const total = ref(0)
    const loading = ref(false)
    const error = ref(null)
    let request = 0

    async function reload() {
        const current = ++request
        const latest = () => current === request
        loading.value = true
        error.value = null
        try {
            const { data, pagination } = await load(toListParams(state.value))
            if (!latest()) return
            if (pagination.pages > 0 && state.value.page > pagination.pages) {
                // The page is gone (its last row was deleted): the last page takes its place
                await router.replace({ query: listQuery({ ...state.value, page: pagination.pages }, config) })
                return
            }
            items.value = data
            total.value = pagination.total
        } catch (failure) {
            if (latest()) error.value = failure
        } finally {
            if (latest()) loading.value = false
        }
    }

    watch(
        () => route.query,
        (query) => {
            if (route.name !== name) return
            const canonical = canonicalListQuery(query, config)
            if (canonical) router.replace({ query: canonical })
            else reload()
        },
        { immediate: true }
    )

    /** Changes the list through the address; a new search, filter, page size or sort starts from page 1 */
    function update(patch) {
        return router.push({ query: listQuery({ ...state.value, page: 1, ...patch }, config) })
    }

    return { state, items, total, loading, error, update, reload }
}
