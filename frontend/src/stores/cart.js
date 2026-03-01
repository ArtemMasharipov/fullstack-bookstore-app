import { useNotifications } from '@/composables/useNotifications'
import { cartApi } from '@/services/api/cartApi'
import { withLoading } from './storeHelpers'
import { defineStore } from 'pinia'

/** Check auth without importing auth store (avoids circular dep) */
const isLoggedIn = () => !!localStorage.getItem('token')

/**
 * Cart Store
 * Manages shopping cart: server-side for authenticated users, localStorage for guests.
 */
export const useCartStore = defineStore('cart', {
    state: () => ({
        items: JSON.parse(localStorage.getItem('cart')) || [],
        loading: false,
        error: null,
    }),

    getters: {
        /**
         * Normalize items for display.
         * Server items have `book` (populated object), local items have `bookId` (string) + title/image.
         */
        cartItems: (state) =>
            state.items.map((item) => {
                const bookData = typeof item.book === 'object' && item.book ? item.book : null
                const bookId = bookData?._id || bookData?.id || item.book || item.bookId

                return {
                    id: bookId,
                    _id: bookId,
                    bookId: {
                        id: bookId,
                        _id: bookId,
                        title: bookData?.title || item.title || 'Unknown Book',
                        image: bookData?.image || item.image,
                    },
                    quantity: Number(item.quantity) || 1,
                    price: Number(item.price) || 0,
                }
            }),

        cartTotal: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),

        itemCount: (state) => state.items.length,

        totalQuantity: (state) => state.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
    },

    actions: {
        // -- Server/local routing helpers --

        /** Extract items from API response: { success, data: { items }, message } */
        _extractItems(response) {
            return response?.data?.items ?? []
        },

        /** Get book ID string from any item shape */
        _getBookId(item) {
            if (typeof item.book === 'object' && item.book) {
                return String(item.book._id || item.book.id)
            }
            return String(item.bookId || item.book)
        },

        /** Persist items to state + localStorage */
        _persist() {
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        // -- Public actions --

        async fetchCart() {
            return withLoading(this, async () => {
                const response = await cartApi.fetchCart()
                this.setItems(this._extractItems(response))
            })
        },

        async addToCart({ bookId, quantity = 1, price, title = 'Book', image }) {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
                if (isLoggedIn()) {
                    const response = await cartApi.addToCart({ bookId, quantity, price })
                    this.setItems(this._extractItems(response))
                } else {
                    const id = String(bookId)
                    const existing = this.items.find((i) => this._getBookId(i) === id)
                    if (existing) {
                        existing.quantity += quantity
                    } else {
                        this.items.push({ bookId: id, quantity, price, title, image })
                    }
                    this._persist()
                }

                showSuccess(`"${title}" added to cart`, { icon: 'mdi-cart-plus' })
            })
        },

        async removeFromCart(bookId, title = 'Item') {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
                if (isLoggedIn()) {
                    const response = await cartApi.removeFromCart(bookId)
                    this.setItems(this._extractItems(response))
                } else {
                    const id = String(bookId)
                    this.items = this.items.filter((i) => this._getBookId(i) !== id)
                    this._persist()
                }

                showSuccess(`"${title}" removed from cart`, { icon: 'mdi-cart-minus' })
            })
        },

        async updateQuantity({ itemId, quantity, title = 'Item' }) {
            const { showError } = useNotifications()

            if (isLoggedIn()) {
                const id = String(itemId)
                const item = this.items.find((i) => this._getBookId(i) === id)
                if (!item) return

                const prev = item.quantity
                // Optimistic update — instant UI, no loading spinner
                item.quantity = quantity
                this._persist()

                try {
                    await cartApi.updateQuantity(itemId, quantity)
                } catch {
                    // Rollback on failure
                    item.quantity = prev
                    this._persist()
                    showError(`Could not update "${title}" quantity`)
                }
            } else {
                const id = String(itemId)
                const item = this.items.find((i) => this._getBookId(i) === id)
                if (item) {
                    item.quantity = quantity
                    this._persist()
                }
            }
        },

        async clearCart() {
            const { showSuccess } = useNotifications()

            return withLoading(this, async () => {
                if (isLoggedIn()) {
                    await cartApi.clearCart()
                }
                this.items = []
                localStorage.removeItem('cart')
                showSuccess('Cart cleared successfully', { icon: 'mdi-cart-off' })
            })
        },

        async syncCart() {
            return withLoading(this, async () => {
                const localCart = JSON.parse(localStorage.getItem('cart')) || []
                if (localCart.length === 0) return

                const response = await cartApi.syncCart(localCart)
                const items = this._extractItems(response)
                if (items.length > 0) {
                    this.setItems(items)
                }
                localStorage.removeItem('cart')
            })
        },

        setItems(items) {
            this.items = items || []
            this._persist()
        },

        setError(message) {
            this.error = message
        },

        clearError() {
            this.error = null
        },
    },
})
