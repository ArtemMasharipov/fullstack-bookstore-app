import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const orderApi = createApiClient('orders', {
    createOrder: (orderData) => apiRequest('post', '/orders', orderData),
    getOrders: () => apiRequest('get', '/orders'),
    getOrderById: (id) => apiRequest('get', `/orders/${id}`),
    updateOrderStatus: (id, status) => apiRequest('put', `/orders/${id}/status`, { status })
})