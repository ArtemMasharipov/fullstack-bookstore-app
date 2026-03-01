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
                        class="rounded-lg elevation-3"
                    ></v-img>
                </v-col>

                <v-col cols="12" sm="8" md="9">
                    <h1 class="text-h4 font-weight-bold mb-2">{{ book.title || 'No Title' }}</h1>

                    <v-btn
                        v-if="book.author?.id"
                        :to="`/authors/${book.author.id}`"
                        variant="text"
                        color="primary"
                        class="px-0 mb-4 text-h6"
                    >
                        {{ book.author?.name || 'Unknown Author' }}
                    </v-btn>

                    <div class="d-flex flex-wrap ga-2 mb-4">
                        <v-chip size="small" color="secondary" variant="tonal" prepend-icon="mdi-calendar">
                            {{ book.publicationYear || 'N/A' }}
                        </v-chip>
                        <v-chip
                            v-if="book.category"
                            size="small"
                            color="secondary"
                            variant="tonal"
                            prepend-icon="mdi-tag"
                        >
                            {{ book.category }}
                        </v-chip>
                        <v-chip :color="book.inStock ? 'success' : 'error'" size="small">
                            {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                        </v-chip>
                    </div>

                    <div class="text-h4 font-weight-bold text-secondary mb-4">
                        {{ formatPrice(book.price) }}
                    </div>

                    <p v-if="book.description" class="text-body-1 text-medium-emphasis mb-6">
                        {{ book.description }}
                    </p>

                    <!-- Add to cart section -->
                    <div v-if="book.inStock" class="d-flex align-center ga-3 mb-4" style="max-width: 360px">
                        <div class="d-flex align-center">
                            <v-btn
                                icon="mdi-minus"
                                density="compact"
                                variant="outlined"
                                size="small"
                                :disabled="quantity <= 1"
                                aria-label="Decrease quantity"
                                @click="quantity--"
                            />
                            <span class="text-body-1 font-weight-medium mx-3" aria-live="polite">{{ quantity }}</span>
                            <v-btn
                                icon="mdi-plus"
                                density="compact"
                                variant="outlined"
                                size="small"
                                aria-label="Increase quantity"
                                @click="quantity++"
                            />
                        </div>

                        <v-btn
                            size="large"
                            :loading="adding"
                            :prepend-icon="added ? 'mdi-check' : 'mdi-cart-plus'"
                            :color="added ? 'success' : 'primary'"
                            class="flex-grow-1"
                            @click="handleAddToCart"
                        >
                            {{ added ? 'Added!' : 'Add to Cart' }}
                        </v-btn>
                    </div>

                    <v-alert
                        v-else
                        type="warning"
                        variant="tonal"
                        density="compact"
                        class="mb-4"
                        style="max-width: 360px"
                    >
                        This book is currently out of stock.
                    </v-alert>

                    <!-- Trust cues -->
                    <div class="d-flex flex-wrap ga-4 mt-2">
                        <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
                            <v-icon size="16">mdi-truck-delivery-outline</v-icon>
                            Free shipping over $50
                        </div>
                        <div class="d-flex align-center ga-1 text-caption text-medium-emphasis">
                            <v-icon size="16">mdi-autorenew</v-icon>
                            30-day returns
                        </div>
                    </div>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <v-row v-if="relatedBooks && relatedBooks.length > 0">
                <v-col cols="12">
                    <h2 class="text-h5 font-weight-bold mb-4">Related Books</h2>

                    <v-slide-group v-if="!loading" show-arrows>
                        <v-slide-group-item
                            v-for="(relatedBook, index) in relatedBooks"
                            :key="relatedBook?.id || `related-book-${index}`"
                            v-slot="{}"
                        >
                            <div class="pa-2" style="width: 250px">
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
import { useBooksStore, useCartStore } from '@/stores'
import { formatPrice } from '@/utils'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
    bookId: {
        type: String,
        required: true,
    },
})

const router = useRouter()
const booksStore = useBooksStore()
const cartStore = useCartStore()

const { currentBook, loading, error } = storeToRefs(booksStore)

const placeholderImage = ref('/images/placeholder.png')
const quantity = ref(1)
const adding = ref(false)
const added = ref(false)

const book = computed(() => currentBook.value)
const relatedBooks = computed(() => (book.value ? book.value.relatedBooks || [] : []))

const breadcrumbItems = computed(() => [
    { title: 'Books', to: '/books' },
    { title: book.value?.title || 'Unknown Title', disabled: true },
])

const fetchBook = (id) => booksStore.fetchBookById(id)

const handleAddToCart = async () => {
    if (!book.value.inStock || adding.value) return

    adding.value = true
    try {
        await cartStore.addToCart({
            bookId: book.value.id || book.value._id,
            quantity: quantity.value,
            price: book.value.price,
            title: book.value.title || 'Book',
            image: book.value.image,
        })
        added.value = true
        setTimeout(() => {
            added.value = false
        }, 2000)
    } catch (error) {
        // Failed to add to cart
    } finally {
        adding.value = false
    }
}

const navigateToBook = (navBook) => {
    if (navBook.id === props.bookId) return
    router.push(`/books/${navBook.id}`)
    fetchBook(navBook.id)
    quantity.value = 1
    added.value = false
}

onMounted(() => {
    fetchBook(props.bookId)
})
</script>
