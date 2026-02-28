/**
 * Composable for add-to-cart logic
 * Separation of concerns: cart operations isolated from presentation
 */
import { useAuthStore, useCartStore } from '@/stores'
import { ref } from 'vue'

export function useAddToCart() {
    const cartStore = useCartStore()
    const authStore = useAuthStore()

    const loading = ref(false)

    const canAddToCart = (book) => {
        if (loading.value || !book?.inStock) return false
        // Guests can add to local cart; authenticated users need permission
        return !authStore.isAuthenticated || authStore.hasPermission?.('create:cart')
    }

    async function addToCart(book) {
        if (!book?.inStock) return false

        loading.value = true
        try {
            await cartStore.addToCart({
                bookId: book.id || book._id,
                quantity: 1,
                price: book.price,
                title: book.title || 'Book',
                image: book.image,
            })
            return true
        } catch {
            return false
        } finally {
            loading.value = false
        }
    }

    return { loading, canAddToCart, addToCart }
}
