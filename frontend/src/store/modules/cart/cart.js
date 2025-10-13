import { useNotifications } from '@/composables/useNotifications'
import { cartApi } from '@/services/api/cartApi'
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
            state.items.map(({ _id, bookId, quantity, price }) => ({
                _id,
                bookId: {
                    _id: bookId?._id || bookId,
                    title: bookId?.title || 'Unknown Book',
                    image: bookId?.image,
                },
                quantity: Number(quantity),
                price: Number(price),
            })),

        /**
         * Check loading state
         */
        cartLoading: (state) => state.loading,

        /**
         * Get error message
         */
        cartError: (state) => state.error,

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
            this.loading = true
            this.error = null

            try {
                const { items = [] } = (await cartApi.fetchCart()) || {}
                this.setItems(items)
            } catch (error) {
                this.error = error.message
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Add item to cart
         */
        async addToCart({ bookId, quantity, price, title = 'Book' }) {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const { useAuthStore } = await import('@/store/modules/auth')
                const authStore = useAuthStore()

                if (authStore.isAuthenticated) {
                    // Server-side cart
                    const { items } = await cartApi.addToCart({ bookId, quantity, price })
                    this.setItems(items)
                } else {
                    // Local cart
                    this.addLocalItem({ bookId, quantity, price })
                }

                showSuccess(`"${title}" added to cart`, {
                    icon: 'mdi-cart-plus',
                })
            } catch (error) {
                this.error = error.message
                showError(`Failed to add "${title}" to cart: ${error.message}`, {
                    icon: 'mdi-cart-remove',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Remove item from cart
         */
        async removeFromCart(itemId, title = 'Item') {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const response = await cartApi.removeFromCart(itemId)
                this.setItems(response.items)

                showSuccess(`"${title}" removed from cart`, {
                    icon: 'mdi-cart-minus',
                })
            } catch (error) {
                this.error = error.message
                showError(`Failed to remove "${title}" from cart: ${error.message}`, {
                    icon: 'mdi-alert-circle',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update item quantity
         */
        async updateQuantity(payload) {
            const { title = 'Item' } = payload
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                const { useAuthStore } = await import('@/store/modules/auth')
                const authStore = useAuthStore()

                if (authStore.isAuthenticated) {
                    // Server-side cart
                    const response = await cartApi.updateQuantity(payload.itemId, payload.quantity)
                    if (response?.items) {
                        this.setItems(response.items)
                    }
                } else {
                    // Local cart
                    this.updateLocalQuantity(payload)
                }

                showSuccess(`"${title}" quantity updated to ${payload.quantity}`, {
                    icon: 'mdi-cart-outline',
                })
            } catch (error) {
                this.error = error.message
                showError(`Failed to update quantity: ${error.message}`, {
                    icon: 'mdi-alert-circle',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Clear cart
         */
        async clearCart() {
            this.loading = true
            this.error = null

            const { showSuccess, showError } = useNotifications()

            try {
                await cartApi.clearCart()
                this.items = []
                localStorage.removeItem('cart')

                showSuccess('Cart cleared successfully', {
                    icon: 'mdi-cart-off',
                })
            } catch (error) {
                this.error = error.message
                showError(`Failed to clear cart: ${error.message}`, {
                    icon: 'mdi-alert-circle',
                })
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Sync local cart with server after login
         */
        async syncCart() {
            this.loading = true
            this.error = null

            try {
                const localCart = JSON.parse(localStorage.getItem('cart')) || []

                if (localCart.length === 0) {
                    return
                }

                const response = await cartApi.syncCart(localCart)

                if (response?.items) {
                    this.setItems(response.items)
                    localStorage.removeItem('cart')
                }
            } catch (error) {
                this.error = error.message
                // Cart sync failed
            } finally {
                this.loading = false
            }
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
            const existingItem = this.items.find((i) => i.bookId?._id === item.bookId?._id || i.bookId === item.bookId)
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
