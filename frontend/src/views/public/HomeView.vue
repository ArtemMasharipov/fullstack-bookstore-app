<template>
    <div>
        <!-- Hero Section -->
        <v-sheet class="hero-section py-16 text-center" color="primary">
            <v-container>
                <v-row justify="center">
                    <v-col cols="12" md="8" lg="6">
                        <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-4">
                            Discover Your Next Great Read
                        </h1>
                        <p class="text-body-1 text-white mb-8" style="opacity: 0.85">
                            Browse our curated collection of books across every genre. From timeless classics to the
                            latest bestsellers.
                        </p>
                        <v-btn
                            color="secondary"
                            size="x-large"
                            to="/books"
                            prepend-icon="mdi-book-open-page-variant-outline"
                            elevation="3"
                        >
                            Browse Books
                        </v-btn>
                    </v-col>
                </v-row>
            </v-container>
        </v-sheet>

        <!-- Categories Section -->
        <v-container class="py-10">
            <h2 class="text-h5 font-weight-bold text-center mb-6">Browse by Category</h2>
            <div class="d-flex flex-wrap justify-center ga-2">
                <v-chip
                    v-for="category in featuredCategories"
                    :key="category.name"
                    :to="`/books?category=${category.name}`"
                    :prepend-icon="category.icon"
                    size="large"
                    variant="outlined"
                    color="primary"
                    class="category-chip"
                >
                    {{ category.name }}
                </v-chip>
            </div>
        </v-container>

        <v-divider />

        <!-- Featured Books Section -->
        <v-container class="py-10">
            <div class="d-flex align-center justify-space-between mb-6">
                <h2 class="text-h5 font-weight-bold">Latest Books</h2>
                <v-btn variant="text" to="/books" append-icon="mdi-arrow-right"> View All </v-btn>
            </div>

            <v-skeleton-loader v-if="loading" type="card-avatar, card-avatar, card-avatar, card-avatar" />

            <v-row v-else-if="featuredBooks.length">
                <v-col
                    v-for="book in featuredBooks"
                    :key="book.id ?? book._id"
                    cols="12"
                    sm="6"
                    md="3"
                    class="d-flex align-stretch"
                >
                    <book-card :book="book" class="w-100" @click="router.push(`/books/${book.id ?? book._id}`)" />
                </v-col>
            </v-row>

            <v-alert v-else type="info" variant="tonal" icon="mdi-bookshelf" class="text-center">
                No books available yet. Check back soon!
            </v-alert>
        </v-container>

        <v-divider />

        <!-- Trust Section -->
        <v-container class="py-10">
            <v-row justify="center">
                <v-col v-for="item in trustItems" :key="item.title" cols="12" sm="4" class="text-center">
                    <v-icon :icon="item.icon" size="48" color="secondary" class="mb-3" />
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.title }}</h3>
                    <p class="text-body-2 text-medium-emphasis">{{ item.description }}</p>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import BookCard from '@/components/features/books/BookCard.vue'
import { useBooksStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const booksStore = useBooksStore()
const { books, loading } = storeToRefs(booksStore)

const featuredBooks = computed(() => books.value.slice(0, 4))

const featuredCategories = [
    { name: 'Fiction', icon: 'mdi-book-open-variant' },
    { name: 'Science Fiction', icon: 'mdi-rocket-launch-outline' },
    { name: 'Fantasy', icon: 'mdi-creation-outline' },
    { name: 'Mystery', icon: 'mdi-magnify' },
    { name: 'Biography', icon: 'mdi-account-outline' },
    { name: 'History', icon: 'mdi-clock-outline' },
    { name: 'Science', icon: 'mdi-flask-outline' },
    { name: 'Technology', icon: 'mdi-laptop' },
]

const trustItems = [
    {
        icon: 'mdi-truck-delivery-outline',
        title: 'Fast Delivery',
        description: 'Free shipping on orders over $50. Quick and reliable delivery to your door.',
    },
    {
        icon: 'mdi-shield-check-outline',
        title: 'Secure Payment',
        description: 'Your payment information is always protected with industry-standard encryption.',
    },
    {
        icon: 'mdi-autorenew',
        title: 'Easy Returns',
        description: '30-day hassle-free return policy. Not satisfied? Send it back, no questions asked.',
    },
]

onMounted(() => {
    booksStore.limit = 4
    booksStore.loadBooks()
})
</script>

<style scoped>
.hero-section {
    background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #2a4470 100%);
}

.category-chip {
    transition: transform var(--motion-fast) var(--motion-ease);
}

.category-chip:hover {
    transform: translateY(-2px);
}
</style>
