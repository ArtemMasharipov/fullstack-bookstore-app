import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const orderApi = createApiClient('orders', {
    createOrder: (orderData) => apiRequest('post', '/orders', orderData),
    getOrders: () => apiRequest('get', '/orders'),
    getOrderById: (id) => apiRequest('get', `/orders/${id}`),
    updateOrderStatus: (id, status) => apiRequest('put', `/orders/${id}/status`, { status }),
    getOrderStatus: (id) => apiRequest('get', `/orders/${id}/status`),
    updateTracking: (id, trackingNumber) => apiRequest('put', `/orders/${id}/tracking`, { trackingNumber }),
    getOrderHistory: (id) => apiRequest('get', `/orders/${id}/history`),
})
