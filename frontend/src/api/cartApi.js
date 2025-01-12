import { createApiClient } from './apiFactory'
import { apiRequest } from './baseApi'

export const cartApi = createApiClient('cart', {
    fetchCart: () => apiRequest('get', '/cart'),
    addToCart: (item) => {
        console.log('CartAPI: Attempting to add item:', item);
        return apiRequest('post', '/cart/add', item)
            .then(response => {
                console.log('CartAPI: Add success:', response);
                return response;
            })
            .catch(error => {
                console.error('CartAPI: Add failed:', error);
                throw error;
            });
    },
    removeFromCart: (itemId) => apiRequest('delete', `/cart/items/${itemId}`),
    updateQuantity: (itemId, quantity) => apiRequest('put', `/cart/items/${itemId}`, { quantity }),
    clearCart: () => apiRequest('delete', '/cart'),
    syncCart: (cart) => apiRequest('post', '/cart/sync', { cart })
})
