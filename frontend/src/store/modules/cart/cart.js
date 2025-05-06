import { cartApi } from '@/services/api/cartApi'
import { useAuthStore } from '@/store/modules/auth'
import { handleAsyncAction } from '@/store/modules/ui'
import { createBaseStore } from '@/store/modules/ui'
import { syncError, syncInfo, syncSuccess } from '@/utils/helpers'

/**
 * Cart store using the base store factory
 * - Uses shared logic from the factory for loading and error states
 * - Implements cart-specific functionality for local and server storage
 */
export const useCartStore = createBaseStore({
    id: 'cart',
    api: cartApi,

    // Custom state specific to cart store
    customState: () => ({
        items: JSON.parse(localStorage.getItem('cart')) || [],
        // loading and error are provided by the base store
    }),

    // Custom getters specific to cart store
    customGetters: {
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
        cartLoading: (state) => state.loading,
        cartError: (state) => state.error,
        cartTotal: (state) => {
            return state.items.reduce((total, item) => {
                return total + item.price * item.quantity
            }, 0)
        },
        itemCount: (state) => state.items.length,
        /**
         * Total quantity of all items in the cart
         */
        totalQuantity: (state) => {
            return state.items.reduce((total, item) => total + (Number(item.quantity) || 1), 0)
        },
    },

    // Custom actions specific to cart store
    customActions: {
        /**
         * Fetch cart items from the server
         */
        async fetchCart() {
            return handleAsyncAction(this, async () => {
                const { items = [] } = (await cartApi.fetchCart()) || {}
                this.setItems(items)
            })
        },
        /**
         * Add an item to the cart
         * @param {Object} item - Item to add
         * @param {string} item.bookId - Book ID
         * @param {number} item.quantity - Quantity
         * @param {number} item.price - Price
         * @param {string} item.title - Book title (optional)
         */
        async addToCart({ bookId, quantity, price, title = 'Book' }) {
            return handleAsyncAction(this, async () => {
                try {
                    const authStore = useAuthStore()
                    if (authStore.isAuthenticated) {
                        // Server-side cart
                        const { items } = await cartApi.addToCart({ bookId, quantity, price })
                        this.setItems(items)
                    } else {
                        // Local cart
                        this.addLocalItem({ bookId, quantity, price })
                    }

                    // Используем syncSuccess для надежного отображения уведомлений
                    syncSuccess(`"${title}" added to cart`, {
                        icon: 'shopping_cart',
                    })
                } catch (error) {
                    syncError(`Failed to add "${title}" to cart: ${error.message}`)
                    throw error
                }
            })
        },
        /**
         * Remove an item from the cart
         * @param {string} itemId - Item ID to remove
         * @param {string} title - Book title (optional)
         */
        async removeFromCart(itemId, title = 'Item') {
            return handleAsyncAction(this, async () => {
                try {
                    const response = await cartApi.removeFromCart(itemId)
                    this.setItems(response.items)

                    // Используем syncInfo для надежного отображения уведомлений
                    syncInfo(`"${title}" removed from cart`)
                } catch (error) {
                    syncError(`Failed to remove "${title}" from cart: ${error.message}`)
                    throw error
                }
            })
        },
        /**
         * Update item quantity
         * @param {Object} payload - Update data
         * @param {string} payload.itemId - Item ID
         * @param {number} payload.quantity - New quantity
         * @param {string} payload.title - Book title (optional)
         */
        async updateQuantity(payload) {
            const { title = 'Item' } = payload

            return handleAsyncAction(this, async () => {
                try {
                    const authStore = useAuthStore()
                    if (authStore.isAuthenticated) {
                        // Server-side cart
                        const response = await cartApi.updateQuantity(payload.itemId, payload.quantity)
                        if (response && response.items) {
                            this.setItems(response.items)
                        }
                    } else {
                        // Local cart
                        this.updateLocalQuantity(payload)
                    }

                    // Используем syncInfo для надежного отображения уведомлений
                    syncInfo(`"${title}" quantity updated to ${payload.quantity}`)
                } catch (error) {
                    syncError(`Failed to update quantity: ${error.message}`)
                    throw error
                }
            })
        },
        /**
         * Clear the cart
         */
        async clearCart() {
            return handleAsyncAction(this, async () => {
                try {
                    await cartApi.clearCart()
                    this.items = []
                    localStorage.removeItem('cart')

                    // Используем syncInfo для надежного отображения уведомлений
                    syncInfo('Cart cleared successfully')
                } catch (error) {
                    syncError(`Failed to clear cart: ${error.message}`)
                    throw error
                }
            })
        },

        /**
         * Synchronize local cart with server after login
         */
        async syncCart() {
            return handleAsyncAction(this, async () => {
                const localCart = JSON.parse(localStorage.getItem('cart')) || []
                const response = await cartApi.syncCart(localCart)

                if (response?.items) {
                    this.setItems(response.items)
                    localStorage.removeItem('cart')
                } else {
                    throw new Error('Failed to sync cart')
                }
            })
        },

        /**
         * Helper method to set items and update localStorage
         * @param {Array} items - Cart items
         */
        setItems(items) {
            this.items = items || []
            localStorage.setItem('cart', JSON.stringify(this.items))
        },

        /**
         * Add an item to local storage cart
         * @param {Object} item - Item to add
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
         * Update quantity in local storage cart
         * @param {Object} payload - Update data
         */
        updateLocalQuantity({ bookId, quantity }) {
            const item = this.items.find((i) => i.bookId === bookId)
            if (item) {
                item.quantity = quantity
            }
            localStorage.setItem('cart', JSON.stringify(this.items))
        },
    },
})
