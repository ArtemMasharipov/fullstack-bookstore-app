import { onScopeDispose, reactive } from 'vue'
import { booksApi } from '@/services/api/booksApi'
import { authorsApi } from '@/services/api/authorsApi'
import { orderApi } from '@/services/api/orderApi'
import { usersApi } from '@/services/api/usersApi'

/** Dashboard reads stay local: catalogue totals use pagination, never the first page's length. */
export function useAdminDashboard() {
    const loaders = {
        books: async () => (await booksApi.fetchAll({ page: 1, limit: 1 })).pagination.total,
        authors: async () => (await authorsApi.fetchAll({ page: 1, limit: 1 })).pagination.total,
        orders: () => orderApi.adminStats(),
        users: () => usersApi.stats(),
        recent: async () => (await orderApi.adminList({ page: 1, limit: 5, sortBy: '-createdAt' })).items,
    }
    const resources = reactive(
        Object.fromEntries(Object.keys(loaders).map((name) => [name, { data: null, loading: true, error: null }]))
    )
    const pending = new Map(),
        requests = new Map()
    let alive = true
    onScopeDispose(() => {
        alive = false
        pending.clear()
    })
    function reload(name) {
        if (!alive || !Object.hasOwn(loaders, name)) return Promise.resolve()
        if (pending.has(name)) return pending.get(name)
        const resource = resources[name],
            current = (requests.get(name) ?? 0) + 1
        requests.set(name, current)
        const latest = () => alive && requests.get(name) === current
        resource.loading = true
        resource.error = null
        const promise = Promise.resolve()
            .then(loaders[name])
            .then((data) => {
                if (latest()) resource.data = data
            })
            .catch((failure) => {
                if (latest()) resource.error = failure
            })
            .finally(() => {
                if (latest()) {
                    resource.loading = false
                    pending.delete(name)
                }
            })
        pending.set(name, promise)
        return promise
    }
    for (const name of Object.keys(loaders)) reload(name)
    return { resources, reload }
}
