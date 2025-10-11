import baseApi from './baseApi'

/**
 * Orders API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const orderApi = {
    fetchAll: (params) => baseApi.get('/orders', { params }).then((res) => res.data),

    fetchById: (id) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.get(`/orders/${id}`).then((res) => res.data)
    },

    create: (data) => baseApi.post('/orders', data).then((res) => res.data),

    update: (id, data) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.put(`/orders/${id}`, data).then((res) => res.data)
    },

    delete: (id) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.delete(`/orders/${id}`).then((res) => res.data)
    },

    // Custom methods
    createOrder: (orderData) => baseApi.post('/orders', orderData).then((res) => res.data),

    getOrders: () => baseApi.get('/orders').then((res) => res.data),

    getOrderById: (id) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.get(`/orders/${id}`).then((res) => res.data)
    },

    updateOrderStatus: (id, status) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.put(`/orders/${id}/status`, { status }).then((res) => res.data)
    },

    getOrderStatus: (id) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.get(`/orders/${id}/status`).then((res) => res.data)
    },

    updateTracking: (id, trackingNumber) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.put(`/orders/${id}/tracking`, { trackingNumber }).then((res) => res.data)
    },

    getOrderHistory: (id) => {
        if (!id) throw new Error('Order ID is required')
        return baseApi.get(`/orders/${id}/history`).then((res) => res.data)
    },
}
