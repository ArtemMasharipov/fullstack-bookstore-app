import baseApi from './baseApi'

const unwrap = (response) => response.data.data

/** User DTOs and server pages; account status changes through its own route. */
export const usersApi = {
    list: (params) =>
        baseApi.get('/users', { params }).then((response) => ({
            data: response.data.data,
            pagination: response.data.pagination,
        })),

    get: (id) => baseApi.get(`/users/${id}`).then(unwrap),

    setStatus: (id, isActive) => baseApi.patch(`/users/${id}/status`, { isActive }).then(unwrap),

    stats: () => baseApi.get('/users/stats').then(unwrap),

    create: (data) => baseApi.post('/users', data).then(unwrap),

    update: (id, data) => {
        if (!id) throw new Error('User ID is required')
        return baseApi.put(`/users/${id}`, data).then(unwrap)
    },
}
