/**
 * Composable for handling cart operations
 * Provides reactive cart state and methods for cart management
 */
import { useCartStore } from '@/store'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'
import { useAuth } from './useAuth'

export function useCart() {
    // Stores and composables
    const cartStore = useCartStore()
    const { isAuthenticated } = useAuth()

    // Extract reactive state
    const { items, loading, error } = storeToRefs(cartStore)

    // Computed properties
    const cartItems = computed(() => cartStore.cartItems)
    const itemCount = computed(() => cartStore.itemCount)
    const totalQuantity = computed(() => cartStore.totalQuantity)
    const cartTotal = computed(() => cartStore.cartTotal)
    const isEmpty = computed(() => cartItems.value.length === 0)
    const hasItems = computed(() => !isEmpty.value)

    // Individual item calculations
    const getItemTotal = computed(() => (item) => {
        return item.quantity * item.price
    })

    const getItemById = computed(() => (bookId) => {
        return cartItems.value.find((item) => item.bookId._id === bookId)
    })

    const isInCart = computed(() => (bookId) => {
        return !!getItemById.value(bookId)
    })

    // Cart operations
    async function addToCart(item) {
        try {
            await cartStore.addToCart(item)
            logger.info(`Added "${item.title || item.bookId?.title || 'item'}" to cart`, null, 'cart')

            // Sync with server if authenticated
            if (isAuthenticated.value) {
                await syncWithServer()
            }
        } catch (error) {
            logger.error('Failed to add item to cart', error, 'cart')
            throw error
        }
    }

    async function removeFromCart(itemId) {
        try {
            const item = cartItems.value.find((item) => item._id === itemId)
            await cartStore.removeFromCart(itemId)
            logger.info(`Removed "${item?.bookId?.title || 'item'}" from cart`, null, 'cart')

            // Sync with server if authenticated
            if (isAuthenticated.value) {
                await syncWithServer()
            }
        } catch (error) {
            logger.error('Failed to remove item from cart', error, 'cart')
            throw error
        }
    }

    async function updateQuantity(itemId, quantity) {
        try {
            if (quantity <= 0) {
                await removeFromCart(itemId)
                return
            }

            await cartStore.updateQuantity({ itemId, quantity })

            // Sync with server if authenticated
            if (isAuthenticated.value) {
                await syncWithServer()
            }
        } catch (error) {
            // Failed to update quantity
            throw error
        }
    }

    async function increaseQuantity(itemId) {
        const item = cartItems.value.find((item) => item._id === itemId)
        if (item) {
            await updateQuantity(itemId, item.quantity + 1)
        }
    }

    async function decreaseQuantity(itemId) {
        const item = cartItems.value.find((item) => item._id === itemId)
        if (item) {
            await updateQuantity(itemId, item.quantity - 1)
        }
    }

    async function clearCart() {
        try {
            await cartStore.clearCart()
            logger.info('Cart cleared', null, 'cart')

            // Sync with server if authenticated
            if (isAuthenticated.value) {
                await syncWithServer()
            }
        } catch (error) {
            logger.error('Failed to clear cart', error, 'cart')
            throw error
        }
    }

    // Server synchronization
    async function fetchCart() {
        if (!isAuthenticated.value) return

        try {
            await cartStore.fetchCart()
        } catch (error) {
            logger.error('Failed to load cart from server', error, 'cart')
            throw error
        }
    }

    async function syncWithServer() {
        if (!isAuthenticated.value) return

        try {
            await cartStore.syncCart()
        } catch (error) {
            logger.error('Failed to sync cart', error, 'cart')
            // Don't show error toast for sync failures as they're background operations
        }
    }

    // Quick add helpers
    async function quickAddBook(book, quantity = 1) {
        const cartItem = {
            bookId: book._id,
            title: book.title,
            price: book.price,
            quantity,
        }

        await addToCart(cartItem)
    }

    async function toggleBookInCart(book) {
        if (isInCart.value(book._id)) {
            const cartItem = getItemById.value(book._id)
            await removeFromCart(cartItem._id)
        } else {
            await quickAddBook(book)
        }
    }

    // Checkout preparation
    function prepareCheckoutData() {
        return {
            items: cartItems.value.map((item) => ({
                bookId: item.bookId._id,
                quantity: item.quantity,
                price: item.price,
            })),
            total: cartTotal.value,
            itemCount: itemCount.value,
        }
    }

    // Validation
    function validateCart() {
        const errors = []

        if (isEmpty.value) {
            errors.push('Cart is empty')
        }

        cartItems.value.forEach((item) => {
            if (!item.bookId || !item.bookId._id) {
                errors.push(`Invalid book reference for item: ${item.title}`)
            }

            if (item.quantity <= 0) {
                errors.push(`Invalid quantity for item: ${item.title}`)
            }

            if (!item.price || item.price <= 0) {
                errors.push(`Invalid price for item: ${item.title}`)
            }
        })

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    // Watch for authentication changes to sync cart
    watch(
        isAuthenticated,
        async (newAuth, oldAuth) => {
            if (newAuth && !oldAuth) {
                // User just logged in, fetch server cart
                await fetchCart()
            } else if (!newAuth && oldAuth) {
                // User just logged out, cart will be maintained locally
                logger.info('User logged out, cart maintained locally', null, 'cart')
            }
        },
        { immediate: true }
    )

    return {
        // State
        items: cartItems,
        loading,
        error,

        // Computed
        itemCount,
        totalQuantity,
        cartTotal,
        isEmpty,
        hasItems,
        getItemTotal,
        getItemById,
        isInCart,

        // Methods
        addToCart,
        removeFromCart,
        updateQuantity,
        increaseQuantity,
        decreaseQuantity,
        clearCart,

        // Server sync
        fetchCart,
        syncWithServer,

        // Quick helpers
        quickAddBook,
        toggleBookInCart,

        // Checkout
        prepareCheckoutData,
        validateCart,

        // Store methods
        clearError: cartStore.clearError,
    }
}
