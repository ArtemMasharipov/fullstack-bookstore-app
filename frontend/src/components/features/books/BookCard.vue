<template>
    <v-card elevation="2" height="100%" hover @click="emit('click', book.id)">
        <v-img
            :src="book.image || placeholderImage"
            :alt="book.title || 'No image available'"
            height="280"
            cover
        ></v-img>

        <v-card-item>
            <v-card-title class="text-truncate">
                {{ book.title || 'No title' }}
            </v-card-title>

            <v-card-subtitle v-if="book.author?.name">
                {{ book.author.name }}
            </v-card-subtitle>
        </v-card-item>

        <v-card-text>
            <v-list-item density="compact" class="px-0" v-if="book.publicationYear">
                <template v-slot:prepend>
                    <v-icon size="small" class="me-1">mdi-calendar</v-icon>
                </template>
                <v-list-item-subtitle>Published: {{ book.publicationYear }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item density="compact" class="px-0" v-if="book.category">
                <template v-slot:prepend>
                    <v-icon size="small" class="me-1">mdi-tag</v-icon>
                </template>
                <v-list-item-subtitle>{{ book.category }}</v-list-item-subtitle>
            </v-list-item>

            <p v-if="book.description" class="text-body-2 mt-3 text-truncate-2">
                {{ book.description }}
            </p>
            <div class="d-flex align-center justify-space-between mt-3">
                <div class="text-subtitle-1 font-weight-bold">
                    {{ formatPriceMethod(book.price) }}
                </div>

                <v-chip :color="book.inStock ? 'success' : 'error'" size="small" variant="tonal">
                    {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                </v-chip>
            </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
            <v-row dense>
                <template v-if="authStore.hasPermission('admin:access')">
                    <v-col cols="12">
                        <v-btn
                            variant="outlined"
                            color="secondary"
                            block
                            density="comfortable"
                            prepend-icon="mdi-shield-account"
                            @click.stop="router.push('/admin/books')"
                        >
                            Manage in Admin
                        </v-btn>
                    </v-col>
                </template>

                <v-col cols="12" class="mt-2">
                    <v-btn
                        v-if="book.inStock"
                        color="primary"
                        block
                        prepend-icon="mdi-cart"
                        :disabled="!canAddToCart"
                        :loading="loading"
                        @click.stop="handleAddToCart"
                    >
                        Add to Cart
                    </v-btn>
                </v-col>
            </v-row>
        </v-card-actions>
    </v-card>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/store'
import { formatPrice } from '@/utils'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Book card component for displaying a single book
 * Used in book listings and search results
 */

// Props
const props = defineProps({
    /**
     * Book object with details
     */
    book: {
        type: Object,
        required: true,
    },
    /**
     * Fallback image when book image is missing
     */
    placeholderImage: {
        type: String,
        default: '/images/placeholder.png',
    },
})

// Emits
const emit = defineEmits(['add-to-cart', 'click'])

// Router
const router = useRouter()

// Store setup
const cartStore = useCartStore()
const authStore = useAuthStore()

// Reactive state
const loading = ref(false)

// Computed properties
/**
 * Determines if user can add book to cart
 */
const canAddToCart = computed(() => {
    return !loading.value && props.book.inStock && authStore && authStore.hasPermission('create:cart')
})

// Methods
/**
 * Format the book price with currency
 */
const formatPriceMethod = (price) => {
    return price ? formatPrice(price) : 'Price not available'
}

/**
 * Handle adding the book to cart
 */
const handleAddToCart = async () => {
    if (!props.book.inStock) return

    loading.value = true
    try {
        await cartStore.addToCart({
            bookId: props.book._id,
            quantity: 1,
            price: props.book.price,
            title: props.book.title || 'Book',
        })
        // Не нужно вызывать toast тут, так как он уже вызывается в store
        // Обновляем состояние корзины, чтобы обновить счетчик в NavBar
        await cartStore.fetchCart()
        emit('add-to-cart') // Emit just the add-to-cart event
    } catch (error) {
        console.error('Failed to add to cart:', error.message)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.text-truncate-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>
