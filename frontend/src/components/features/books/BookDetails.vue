<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <loading-spinner />
        </div>

        <v-container v-else-if="book">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-row>
                <v-col cols="12" sm="4" md="3">
                    <v-img
                        :src="book.image || placeholderImage"
                        :alt="book.title || 'No image available'"
                        aspect-ratio="3/4"
                        cover
                        class="rounded elevation-3"
                    ></v-img>
                </v-col>

                <v-col cols="12" sm="8" md="9">
                    <h1 class="text-h4 mb-2">{{ book.title || 'No Title' }}</h1>

                    <v-btn
                        v-if="book.author?.id"
                        :to="`/authors/${book.author.id}`"
                        variant="text"
                        color="primary"
                        class="px-0 mb-4 text-h6"
                    >
                        {{ book.author?.name || 'Unknown Author' }}
                    </v-btn>

                    <v-row class="mb-3">
                        <v-col cols="auto">
                            <v-chip size="small" color="secondary" variant="tonal">
                                Published: {{ book.publicationYear || 'N/A' }}
                            </v-chip>
                        </v-col>

                        <v-col v-if="book.category" cols="auto">
                            <v-chip size="small" color="secondary" variant="tonal">
                                Category: {{ book.category }}
                            </v-chip>
                        </v-col>
                    </v-row>

                    <div class="d-flex align-center mb-4">
                        <div class="text-h5 font-weight-bold primary--text mr-4">
                            {{ formatPrice(book.price) }}
                        </div>

                        <v-chip :color="book.inStock ? 'success' : 'error'" size="small">
                            {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                        </v-chip>
                    </div>

                    <v-card v-if="book.description" variant="outlined" class="mb-4 bg-grey-lighten-4">
                        <v-card-text>
                            {{ book.description }}
                        </v-card-text>
                    </v-card>

                    <v-row>
                        <v-col cols="12">
                            <v-btn
                                v-if="book.inStock"
                                color="primary"
                                block
                                :loading="loading"
                                @click="handleAddToCart"
                                prepend-icon="mdi-cart-plus"
                            >
                                Add to Cart
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <v-row v-if="relatedBooks && relatedBooks.length > 0">
                <v-col cols="12">
                    <h2 class="text-h5 mb-4">Related Books</h2>

                    <v-slide-group v-if="!loading" show-arrows>
                        <v-slide-group-item
                            v-for="(relatedBook, index) in relatedBooks"
                            :key="relatedBook?.id || `related-book-${index}`"
                            v-slot="{ isSelected, toggle, selectedClass }"
                        >
                            <div class="pa-2">
                                <book-card
                                    v-if="relatedBook"
                                    :book="relatedBook"
                                    @click="navigateToBook(relatedBook)"
                                />
                            </div>
                        </v-slide-group-item>
                    </v-slide-group>
                </v-col>
            </v-row>
        </v-container>
        <v-alert v-else-if="error" type="error" variant="tonal" class="mx-auto my-6" max-width="800">
            {{ error }}
        </v-alert>
    </div>
</template>

<script setup>
import BookCard from '@/components/features/books/BookCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthStore, useBooksStore, useCartStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

// Props
const props = defineProps({
    bookId: {
        type: String,
        required: true,
    },
})

// Emits
const emit = defineEmits(['success', 'error'])

// Router
const router = useRouter()

// Store setup
const booksStore = useBooksStore()
const authStore = useAuthStore()
const cartStore = useCartStore()

// Reactive state extraction
const { currentBook, loading, error } = storeToRefs(booksStore)

// Reactive state
const placeholderImage = ref('/images/placeholder.png')

// Computed properties
const book = computed(() => currentBook.value)

const relatedBooks = computed(() => {
    return book.value ? book.value.relatedBooks || [] : []
})

const breadcrumbItems = computed(() => [
    {
        title: 'Books',
        to: '/books',
    },
    {
        title: book.value?.title || 'Unknown Title',
        disabled: true,
    },
])

// Methods
const fetchBook = (id) => {
    return booksStore.fetchBookById(id)
}

const addToCart = (item) => {
    return cartStore.addToCart(item)
}

const handleAddToCart = async () => {
    if (!book.value.inStock) return

    try {
        await addToCart({
            bookId: book.value.id || book.value._id,
            quantity: 1,
            price: book.value.price,
            title: book.value.title || 'Book',
        })
        // Обновляем состояние корзины, чтобы обновить счетчик в NavBar
        await cartStore.fetchCart()
        // emit('success', 'Added to cart') // Optionally emit event only
    } catch (error) {
        // emit('error', error.message) // Optionally emit error event only
    }
}

const formatPrice = (price) => {
    return price ? `${price} грн` : 'Price not available'
}

const navigateToBook = (book) => {
    // Prevent navigation if we're already on this book
    if (book.id === props.bookId) return

    // Navigate to the new book and refresh the page
    router.push(`/books/${book.id}`)
    // Fetch the new book data
    fetchBook(book.id)
}

// Lifecycle
onMounted(() => {
    fetchBook(props.bookId)
})
</script>
