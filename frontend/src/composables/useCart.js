/**
 * Composable for handling cart operations
 * Provides reactive cart state and methods for cart management
 */
import { useAuthStore, useCartStore } from '@/stores'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

export function useCart() {
    const cartStore = useCartStore()
    const authStore = useAuthStore()
    const { isAuthenticated } = storeToRefs(authStore)

    // Reactive state
    const { loading, error } = storeToRefs(cartStore)

    // Computed properties
    const cartItems = computed(() => cartStore.cartItems)
    const itemCount = computed(() => cartStore.itemCount)
    const totalQuantity = computed(() => cartStore.totalQuantity)
    const cartTotal = computed(() => cartStore.cartTotal)
    const isEmpty = computed(() => cartItems.value.length === 0)
    const hasItems = computed(() => !isEmpty.value)

    const getItemTotal = computed(() => (item) => item.quantity * item.price)

    const getItemById = computed(() => (bookId) => {
        return cartItems.value.find((item) => {
            const itemBookId = item.bookId?.id || item.bookId?._id
            return itemBookId === bookId
        })
    })

    const isInCart = computed(() => (bookId) => !!getItemById.value(bookId))

    // Cart operations — delegate directly to store (which handles server/local routing)
    async function addToCart(item) {
        try {
            await cartStore.addToCart(item)
        } catch (error) {
            logger.error('Failed to add item to cart', error, 'cart')
            throw error
        }
    }

    async function removeFromCart(bookId) {
        try {
            const item = cartItems.value.find((item) => (item.id || item._id) === bookId)
            await cartStore.removeFromCart(bookId, item?.bookId?.title)
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
        } catch (error) {
            throw error
        }
    }

    async function increaseQuantity(itemId) {
        const item = cartItems.value.find((item) => (item.id || item._id) === itemId)
        if (item) {
            await updateQuantity(itemId, item.quantity + 1)
        }
    }

    async function decreaseQuantity(itemId) {
        const item = cartItems.value.find((item) => (item.id || item._id) === itemId)
        if (item) {
            await updateQuantity(itemId, item.quantity - 1)
        }
    }

    async function clearCart() {
        try {
            await cartStore.clearCart()
        } catch (error) {
            logger.error('Failed to clear cart', error, 'cart')
            throw error
        }
    }

    async function fetchCart() {
        if (!isAuthenticated.value) return

        try {
            await cartStore.fetchCart()
        } catch (error) {
            logger.error('Failed to load cart from server', error, 'cart')
            throw error
        }
    }

    // Quick add helpers
    async function quickAddBook(book, quantity = 1) {
        await addToCart({
            bookId: book.id || book._id,
            title: book.title,
            price: book.price,
            image: book.image,
            quantity,
        })
    }

    async function toggleBookInCart(book) {
        const bookId = book.id || book._id
        if (isInCart.value(bookId)) {
            const cartItem = getItemById.value(bookId)
            await removeFromCart(cartItem.id || cartItem._id)
        } else {
            await quickAddBook(book)
        }
    }

    // Checkout preparation
    function prepareCheckoutData() {
        return {
            items: cartItems.value.map((item) => ({
                bookId: item.bookId?.id || item.bookId?._id,
                quantity: item.quantity,
                price: item.price,
            })),
            total: cartTotal.value,
            itemCount: itemCount.value,
        }
    }

    function validateCart() {
        const errors = []

        if (isEmpty.value) {
            errors.push('Cart is empty')
        }

        cartItems.value.forEach((item) => {
            const bookId = item.bookId?.id || item.bookId?._id
            if (!item.bookId || !bookId) {
                errors.push(`Invalid book reference for item: ${item.bookId?.title || 'unknown'}`)
            }
            if (item.quantity <= 0) {
                errors.push(`Invalid quantity for item: ${item.bookId?.title || 'unknown'}`)
            }
            if (!item.price || item.price <= 0) {
                errors.push(`Invalid price for item: ${item.bookId?.title || 'unknown'}`)
            }
        })

        return { isValid: errors.length === 0, errors }
    }

    // Fetch server cart when user authenticates
    watch(
        isAuthenticated,
        async (newAuth, oldAuth) => {
            if (newAuth && !oldAuth) {
                await fetchCart()
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

        // Server
        fetchCart,

        // Helpers
        quickAddBook,
        toggleBookInCart,

        // Checkout
        prepareCheckoutData,
        validateCart,

        // Store
        clearError: cartStore.clearError,
    }
}
