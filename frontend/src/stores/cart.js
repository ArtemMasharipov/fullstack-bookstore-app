import { useNotifications } from '@/composables/useNotifications'
import { cartApi } from '@/services/api/cartApi'
import { withLoading } from './storeHelpers'
import { defineStore } from 'pinia'

/**
 * Cart Store
 * Manages shopping cart with local storage and server sync
 *
 * Simplified version without factory - direct Pinia implementation
 */
export const useCartStore = defineStore('cart', {
    state: () => ({
        // Cart items
        items: JSON.parse(localStorage.getItem('cart')) || [],

        // Loading & error states
        loading: false,
        error: null,
    }),

    getters: {
        /**
         * Get formatted cart items
         */
        cartItems: (state) =>
            state.items.map(({ id, _id, bookId, book, quantity, price }) => {
                const bookData = bookId || book
                return {
                    id: id || _id,
                    _id: _id || id,
                    bookId: {
                        id: bookData?._id || bookData?.id,
                        _id: bookData?._id || bookData?.id,
                        title: bookData?.title || 'Unknown Book',
                        image: bookData?.image,
                    },
                    book: bookData,
                    quantity: Number(quantity),
                    price: Number(price),
                }
            }),

        /**
         * Calculate cart total
         */
        cartTotal: (state) => {
            return state.items.reduce((total, item) => {
                return total + item.price * item.quantity
            }, 0)
        },

        /**
         * Get number of unique items
         */
        itemCount: (state) => state.items.length,

        /**
         * Get total quantity of all items
         */
        totalQuantity: (state) => {
            return state.items.reduce((total, item) => total + (Number(item.quantity) || 1), 0)
        },
    },

    actions: {
        /**
         * Fetch cart from server
         */
        async fetchCart() {
            return withLoading(this, async () => {
                const response = await cartApi.fetchCart()
                const items = response?.data?.items ?? response?.items ?? []
                this.setItems(items)
            })
        },

        /**
         * Add item to cart
         */
        async addToCart({ bookId, quantity, price, title = 'Book' }) {
            const { showSuccess, showError } = useNotifications()

            return withLoading(this, async () => {
                const { useAuthStore } = await import('@/stores/auth')
                const authStore = useAuthStore()

                if (authStore.isAuthenticated) {
                    // Server-side cart
                    const response = await cartApi.addToCart({ bookId, quantity, price })
                    const items = response?.data?.items ?? response?.items ?? []
                    this.setItems(items)
                } else {
                    // Local cart
                    this.addLocalItem({ bookId, quantity, price })
                }

                showSuccess(`"${title}" added to cart`, {
                    icon: 'mdi-cart-plus',
                })
            })
        },

        /**
         * Remove item from cart
         */
        async removeFromCart(itemId, title = 'Item') {
            const { showSuccess, showError } = useNotifications()

            return withLoading(this, async () => {
                const response = await cartApi.removeFromCart(itemId)
                const items = response?.data?.items ?? response?.items ?? []
                this.setItems(items)

                showSuccess(`"${title}" removed from cart`, {
                    icon: 'mdi-cart-minus',
                })
            })
        },

        /**
         * Update item quantity
         */
        async updateQuantity(payload) {
            const { title = 'Item' } = payload
            const { showSuccess, showError } = useNotifications()

            return withLoading(this, async () => {
                const { useAuthStore } = await import('@/stores/auth')
                const authStore = useAuthStore()

                if (authStore.isAuthenticated) {
                    // Server-side cart
                    const response = await cartApi.updateQuantity(payload.itemId, payload.quantity)
                    const items = response?.data?.items ?? response?.items
                    if (items) this.setItems(items)
                } else {
                    // Local cart
                    this.updateLocalQuantity(payload)
                }

                showSuccess(`"${title}" quantity updated to ${payload.quantity}`, {
                    icon: 'mdi-cart-outline',
                })
            })
        },

        /**
         * Clear cart
         */
        async clearCart() {
            const { showSuccess, showError } = useNotifications()

            return withLoading(this, async () => {
                await cartApi.clearCart()
                this.items = []
                localStorage.removeItem('cart')

                showSuccess('Cart cleared successfully', {
                    icon: 'mdi-cart-off',
                })
            })
        },

        /**
         * Sync local cart with server after login
         */
        async syncCart() {
            return withLoading(this, async () => {
                const localCart = JSON.parse(localStorage.getItem('cart')) || []

                if (localCart.length === 0) {
                    return
                }

                const response = await cartApi.syncCart(localCart)

                if (response?.items) {
                    this.setItems(response.items)
                    localStorage.removeItem('cart')
                }
            })
        },

        /**
         * Set items and update localStorage
         */
        setItems(items) {
            this.items = items || []
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        /**
         * Add item to local cart
         */
        addLocalItem(item) {
            const itemBookId = item.bookId?.id || item.bookId?._id || item.bookId
            const existingItem = this.items.find((i) => {
                const existingBookId = i.bookId?.id || i.bookId?._id || i.bookId
                return existingBookId === itemBookId
            })
            if (existingItem) {
                existingItem.quantity += item.quantity
            } else {
                this.items.push(item)
            }
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        /**
         * Update quantity in local cart
         */
        updateLocalQuantity({ bookId, quantity }) {
            const item = this.items.find((i) => i.bookId === bookId)
            if (item) {
                item.quantity = quantity
            }
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        /**
         * Set error message
         */
        setError(message) {
            this.error = message
        },

        /**
         * Clear error message
         */
        clearError() {
            this.error = null
        },
    },
})
