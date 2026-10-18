import baseApi from './baseApi'

/**
 * Users API - direct axios implementation
 * No factory abstractions (PHASE 3)
 */
export const usersApi = {
    fetchAll: (params) => baseApi.get('/users', { params }).then((res) => res.data),

    fetchById: (id) => {
        if (!id) throw new Error('User ID is required')
        return baseApi.get(`/users/${id}`).then((res) => res.data)
    },

    create: (data) => baseApi.post('/users', data).then((res) => res.data),

    update: (id, data) => {
        if (!id) throw new Error('User ID is required')
        return baseApi.put(`/users/${id}`, data).then((res) => res.data)
    },

    delete: (id) => {
        if (!id) throw new Error('User ID is required')
        return baseApi.delete(`/users/${id}`).then((res) => res.data)
    },
}
