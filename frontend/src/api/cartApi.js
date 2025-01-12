import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const cartApi = createApiClient('cart', {
    fetchCart: () => apiRequest('get', '/cart'),
    addToCart: (item) => apiRequest('post', '/cart/add', item),
    removeFromCart: (itemId) => apiRequest('post', `/cart/remove/${itemId}`),
    updateQuantity: (itemId, quantity) => apiRequest('put', `/cart/update/${itemId}`, { quantity }),
    clearCart: () => apiRequest('delete', '/cart'),
    syncCart: (cart) => apiRequest('post', '/cart/sync', { cart })
})
