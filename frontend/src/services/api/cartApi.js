import baseApi from './baseApi'

/**
 * Cart API - direct axios implementation
 * No factory abstractions (ЭТАП 3)
 */
export const cartApi = {
    fetchCart: () => baseApi.get('/cart').then((res) => res.data),
    
    addToCart: (item) => baseApi.post('/cart/add', item).then((res) => res.data),
    
    removeFromCart: (itemId) => {
        if (!itemId) throw new Error('Item ID is required')
        return baseApi.delete(`/cart/items/${itemId}`).then((res) => res.data)
    },
    
    updateQuantity: (itemId, quantity) => {
        if (!itemId) throw new Error('Item ID is required')
        return baseApi.put(`/cart/items/${itemId}`, { quantity }).then((res) => res.data)
    },
    
    clearCart: () => baseApi.delete('/cart').then((res) => res.data),
    
    syncCart: (cart) => baseApi.post('/cart/sync', { items: cart }).then((res) => res.data),
}
