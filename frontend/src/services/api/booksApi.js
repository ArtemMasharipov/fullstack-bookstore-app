import baseApi from './baseApi'

/**
 * Books API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const booksApi = {
    fetchAll: (params) => baseApi.get('/books', { params }).then((res) => res.data),
    
    fetchById: (id) => {
        if (!id) throw new Error('Book ID is required')
        return baseApi.get(`/books/${id}`).then((res) => res.data)
    },
    
    create: (data) => baseApi.post('/books', data).then((res) => res.data),
    
    update: (id, data) => {
        if (!id) throw new Error('Book ID is required')
        return baseApi.put(`/books/${id}`, data).then((res) => res.data)
    },
    
    delete: (id) => {
        if (!id) throw new Error('Book ID is required')
        return baseApi.delete(`/books/${id}`).then((res) => res.data)
    },
}
