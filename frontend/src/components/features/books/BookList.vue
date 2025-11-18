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
            <v-skeleton-loader v-if="loading" type="card-avatar, article, actions" class="py-4"></v-skeleton-loader>

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
                    <v-col v-for="book in books" :key="book.id" cols="12" sm="6" md="4" lg="3"
                        class="d-flex align-stretch">
                        <book-card :book="book" @click="router.push(`/books/${book.id}`)" class="w-100" />
                    </v-col>
                </v-row>
            </v-container>

            <!-- Pagination -->
            <v-card-actions v-if="books.length && totalPages > 1" class="justify-center pa-4">
                <v-pagination v-model="currentPage" :length="totalPages" :total-visible="mobile ? 3 : 7"
                    @update:model-value="booksStore.changePage" rounded color="primary"
                    active-color="primary"></v-pagination>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script setup>
import { useAuthStore, useBooksStore } from '@/stores'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from './BookCard.vue'

/**
 * Component for displaying and managing a paginated list of books
 * Simplified: removed redundant wrappers, using Vuetify breakpoints, direct store access
 */

// Props
const props = defineProps({
    category: {
        type: String,
        default: null,
    },
    authorId: {
        type: String,
        default: null,
    },
    itemsPerPage: {
        type: Number,
        default: 12,
    },
})

// Composables
const router = useRouter()
const { mobile } = useDisplay() // Vuetify breakpoint

// Stores
const authStore = useAuthStore()
const booksStore = useBooksStore()

// Direct state access - no redundant getters
const { books, loading, page, pages } = storeToRefs(booksStore)

// Local state
const searchQuery = ref('')

// Computed
const totalPages = computed(() => pages.value || 1)
const currentPage = computed({
    get: () => page.value,
    set: (value) => (page.value = value),
})

// Watchers
watch(searchQuery, (val) => {
    booksStore.debouncedSearch(val)
})

watch(
    () => [props.category, props.authorId, props.itemsPerPage],
    () => {
        // Sync props to store and load
        booksStore.category = props.category
        booksStore.authorId = props.authorId
        booksStore.limit = props.itemsPerPage
        booksStore.loadBooks()
    }
)

// Lifecycle
onMounted(() => {
    // Sync props and load books
    booksStore.category = props.category
    booksStore.authorId = props.authorId
    booksStore.limit = props.itemsPerPage
    booksStore.loadBooks()
})
</script>
