import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const cartApi = createApiClient('cart', {
    fetchCart: () => apiRequest('get', '/cart'),
    addToCart: (item) => apiRequest('post', '/cart/add', item),
    removeFromCart: (itemId) => apiRequest('delete', `/cart/items/${itemId}`),
    updateQuantity: (itemId, quantity) => apiRequest('put', `/cart/items/${itemId}`, { quantity }),
    clearCart: () => apiRequest('delete', '/cart'),
    syncCart: (cart) => apiRequest('post', '/cart/sync', { cart }),
})
