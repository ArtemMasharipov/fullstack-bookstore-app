import baseApi from './baseApi'

/**
 * Cart API - direct axios implementation
 * No factory abstractions (PHASE 3)
 */
export const cartApi = {
    fetchCart: () => baseApi.get('/cart').then((res) => res.data),

    addToCart: (item) => baseApi.post('/cart', item).then((res) => res.data),

    removeFromCart: (bookId) => {
        if (!bookId) throw new Error('Book ID is required')
        return baseApi.delete(`/cart/${bookId}`).then((res) => res.data)
    },

    updateQuantity: (bookId, quantity) => {
        if (!bookId) throw new Error('Book ID is required')
        return baseApi.put(`/cart/${bookId}`, { quantity }).then((res) => res.data)
    },

    clearCart: () => baseApi.delete('/cart').then((res) => res.data),

    syncCart: (cart) => baseApi.post('/cart/sync', { items: cart }).then((res) => res.data),
}
