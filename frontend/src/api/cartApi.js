import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const cartApi = createApiClient('cart', {
    addToCart: (item) => apiRequest('post', '/cart/add', item),
    removeFromCart: (itemId) => apiRequest('post', '/cart/remove', { itemId }),
    updateQuantity: (payload) => apiRequest('post', '/cart/update', payload),
    clearCart: () => apiRequest('post', '/cart/clear'),
    syncCart: (cart) => apiRequest('post', '/cart/sync', { cart }),
})
