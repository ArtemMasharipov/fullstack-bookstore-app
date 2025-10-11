import baseApi from './baseApi'

/**
 * Roles API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const rolesApi = {
    fetchAll: (params) => baseApi.get('/roles', { params }).then((res) => res.data),

    fetchById: (id) => {
        if (!id) throw new Error('Role ID is required')
        return baseApi.get(`/roles/${id}`).then((res) => res.data)
    },

    create: (data) => baseApi.post('/roles', data).then((res) => res.data),

    update: (id, data) => {
        if (!id) throw new Error('Role ID is required')
        return baseApi.put(`/roles/${id}`, data).then((res) => res.data)
    },

    delete: (id) => {
        if (!id) throw new Error('Role ID is required')
        return baseApi.delete(`/roles/${id}`).then((res) => res.data)
    },
}
