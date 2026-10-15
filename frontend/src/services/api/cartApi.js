import baseApi from './baseApi'

/**
 * Cart API
 * Every call answers the cart view { items, quote } from the envelope's data;
 * merge answers { cart, report }.
 */
const unwrap = (response) => response.data.data

export const cartApi = {
    fetch: () => baseApi.get('/cart').then(unwrap),

    add: (bookId, quantity) => baseApi.post('/cart', { bookId, quantity }).then(unwrap),

    setQuantity: (bookId, quantity) => baseApi.put(`/cart/${bookId}`, { quantity }).then(unwrap),

    remove: (bookId) => baseApi.delete(`/cart/${bookId}`).then(unwrap),

    clear: () => baseApi.delete('/cart').then(unwrap),

    /** Prices a guest cart; nothing is stored */
    quote: (items) => baseApi.post('/cart/quote', { items }).then(unwrap),

    /** Adds the guest cart to the signed-in user's cart */
    merge: (items) => baseApi.post('/cart/merge', { items }).then(unwrap),
}
