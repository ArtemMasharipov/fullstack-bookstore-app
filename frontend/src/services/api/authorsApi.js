import baseApi from './baseApi'

/**
 * Authors API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const authorsApi = {
    fetchAll: (params) => baseApi.get('/authors', { params }).then((res) => res.data),

    fetchById: (id) => {
        if (!id) throw new Error('Author ID is required')
        return baseApi.get(`/authors/${id}`).then((res) => res.data)
    },

    create: (data) => baseApi.post('/authors', data).then((res) => res.data),

    update: (id, data) => {
        if (!id) throw new Error('Author ID is required')
        return baseApi.put(`/authors/${id}`, data).then((res) => res.data)
    },

    delete: (id) => {
        if (!id) throw new Error('Author ID is required')
        return baseApi.delete(`/authors/${id}`).then((res) => res.data)
    },

    fetchPopularAuthors: () => baseApi.get('/authors/popular').then((res) => res.data),
}
