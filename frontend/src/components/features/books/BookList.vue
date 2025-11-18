<template>
    <div>
        <v-card flat class="mb-4">
            <v-toolbar color="primary" flat rounded="0" elevation="1">
                <v-toolbar-title class="text-white font-weight-medium"> Books </v-toolbar-title>

                <v-spacer></v-spacer>
                <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="Search books" hide-details
                    density="compact" variant="solo-filled" class="mx-2 mt-1 shrink" bg-color="primary-lighten-1"
                    style="max-width: 250px" clearable></v-text-field>
                <!-- Admin button removed in preparation for new admin panel -->
            </v-toolbar>

            <!-- Loading state -->
            <v-skeleton-loader v-if="booksLoading" type="card-avatar, article, actions"
                class="py-4"></v-skeleton-loader>

            <!-- Empty state -->
            <v-alert v-else-if="!books.length" type="info" variant="tonal" class="ma-4 text-center" icon="mdi-bookshelf"
                border="start">
                <p class="mb-1">No books found.</p>
                <v-btn v-if="authStore.hasPermission('admin:access')" color="primary" variant="text"
                    density="comfortable" to="/admin/books" prepend-icon="mdi-shield-account">
                    Manage Books
                </v-btn>
                <p v-else class="mt-2 text-caption">Check back later for new books.</p>
            </v-alert>

            <!-- Books grid -->
            <v-container v-else fluid class="py-2">
                <v-row>
                    <v-col v-for="book in books" :key="book.id || book._id" cols="12" sm="6" md="4" lg="3"
                        class="d-flex align-stretch">
                        <book-card :book="book" @click="viewDetails(book.id || book._id)" @add-to-cart="addToCartSuccess"
                            class="w-100" />
                    </v-col>
                </v-row>
            </v-container>

            <!-- Pagination -->
            <v-card-actions v-if="books.length && totalPages > 1" class="justify-center pa-4">
                <v-pagination v-model="currentPage" :length="totalPages" :total-visible="isMobile ? 3 : 7"
                    @update:model-value="changePage" rounded color="primary" active-color="primary"></v-pagination>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script setup>
import { useAuthStore, useBooksStore } from '@/stores'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from './BookCard.vue'

/**
 * Component for displaying and managing a paginated list of books
 */

// Props
const props = defineProps({
    /**
     * Optional category filter
     */
    category: {
        type: String,
        default: null,
    },

    /**
     * Optional author filter
     */
    authorId: {
        type: String,
        default: null,
    },

    /**
     * Number of items to display per page
     */
    itemsPerPage: {
        type: Number,
        default: 12,
    },
})

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()
const booksStore = useBooksStore()

// Extract reactive state from stores
const { booksList: books, booksLoading, booksPagination, page: uiCurrentPage } = storeToRefs(booksStore)

// Local reactive state
const searchQuery = ref('')
const windowWidth = ref(window.innerWidth)

// Computed properties
const totalPages = computed(() => booksPagination.value?.pages || 1)

const isMobile = computed(() => windowWidth.value < 600)

const currentPage = computed({
    get() {
        return uiCurrentPage.value
    },
    set(value) {
        uiCurrentPage.value = value
    },
})

// Methods
const changePage = (page) => {
    return booksStore.changePage(page)
}

const loadBooks = () => {
    // Sync props to store before loading
    booksStore.category = props.category
    booksStore.authorId = props.authorId
    booksStore.limit = props.itemsPerPage

    return booksStore.loadBooks()
}

const handleResize = () => {
    windowWidth.value = window.innerWidth
}

const viewDetails = (bookId) => {
    router.push(`/books/${bookId}`)
}

const addToCartSuccess = () => {
    logger.info('Item added to cart successfully', null, 'book-list')
}

const handleError = (message) => {
    logger.error(message, null, 'book-list')
}

// Watchers
// Watch for search query changes with debounce
watch(searchQuery, (val) => {
    booksStore.debouncedSearch(val)
})

// Watch for prop changes to reload books
watch(
    () => [props.category, props.authorId, props.itemsPerPage],
    () => {
        loadBooks()
    }
)

// Lifecycle hooks
onMounted(() => {
    try {
        // Add event listener for window resizing
        window.addEventListener('resize', handleResize)

        // Initial data fetch
        loadBooks()
    } catch (error) {
        handleError(error.message || 'An error occurred while initializing the book list')
    }
})

onBeforeUnmount(() => {
    // Clean up event listener
    window.removeEventListener('resize', handleResize)
})
</script>
