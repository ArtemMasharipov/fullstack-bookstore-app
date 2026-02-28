<template>
    <div>
        <v-card flat class="mb-4">
            <v-toolbar color="primary" flat rounded="0" elevation="1">
                <v-toolbar-title class="text-white font-weight-medium"> Books </v-toolbar-title>

                <v-spacer></v-spacer>
                <v-text-field
                    v-model="searchQuery"
                    prepend-inner-icon="mdi-magnify"
                    label="Search books"
                    hide-details
                    density="compact"
                    variant="solo-filled"
                    class="mx-2 mt-1 shrink"
                    bg-color="primary-lighten-1"
                    style="max-width: 250px"
                    clearable
                ></v-text-field>
            </v-toolbar>

            <!-- Category filters -->
            <div class="px-4 py-3 d-flex align-center flex-wrap ga-2">
                <v-chip
                    :variant="!selectedCategory ? 'elevated' : 'outlined'"
                    :color="!selectedCategory ? 'primary' : undefined"
                    size="small"
                    @click="selectCategory(null)"
                >
                    All
                </v-chip>
                <v-chip
                    v-for="cat in categories"
                    :key="cat"
                    :variant="selectedCategory === cat ? 'elevated' : 'outlined'"
                    :color="selectedCategory === cat ? 'primary' : undefined"
                    size="small"
                    @click="selectCategory(cat)"
                >
                    {{ cat }}
                </v-chip>
            </div>

            <v-divider />

            <!-- Search progress -->
            <v-progress-linear v-if="searching" indeterminate color="primary" height="3"></v-progress-linear>

            <!-- Loading state -->
            <v-skeleton-loader
                v-if="loading && !searching"
                type="card-avatar, article, actions"
                class="py-4"
            ></v-skeleton-loader>

            <!-- Empty state -->
            <v-alert
                v-else-if="!books.length"
                type="info"
                variant="tonal"
                class="ma-4 text-center"
                icon="mdi-bookshelf"
                border="start"
            >
                <p class="mb-1">No books found.</p>
                <v-btn
                    v-if="authStore.hasPermission('admin:access')"
                    color="primary"
                    variant="text"
                    density="comfortable"
                    to="/admin/books"
                    prepend-icon="mdi-shield-account"
                >
                    Manage Books
                </v-btn>
                <p v-else class="mt-2 text-caption">Check back later for new books.</p>
            </v-alert>

            <!-- Books grid -->
            <v-container v-else fluid class="py-2">
                <p v-if="total > 0" class="text-caption text-medium-emphasis mb-3">
                    Showing {{ books.length }} of {{ total }} books
                </p>
                <v-row>
                    <v-col
                        v-for="book in books"
                        :key="book.id"
                        cols="12"
                        sm="6"
                        md="4"
                        lg="3"
                        class="d-flex align-stretch"
                    >
                        <book-card :book="book" @click="router.push(`/books/${book.id ?? book._id}`)" class="w-100" />
                    </v-col>
                </v-row>
            </v-container>

            <!-- Pagination -->
            <v-card-actions v-if="books.length && totalPages > 1" class="justify-center pa-4">
                <v-pagination
                    v-model="currentPage"
                    :length="totalPages"
                    :total-visible="mobile ? 3 : 7"
                    @update:model-value="booksStore.changePage"
                    rounded
                    color="primary"
                    active-color="primary"
                ></v-pagination>
            </v-card-actions>
        </v-card>
    </div>
</template>

<script setup>
import { useAuthStore, useBooksStore } from '@/stores'
import { BOOK_CATEGORIES } from '@/utils/constants/app'
import { useDisplay } from 'vuetify'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BookCard from './BookCard.vue'

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

const router = useRouter()
const { mobile } = useDisplay()

const authStore = useAuthStore()
const booksStore = useBooksStore()

const { books, loading, searching, page, pages, total } = storeToRefs(booksStore)

const searchQuery = ref('')
const selectedCategory = ref(props.category || null)
const categories = BOOK_CATEGORIES

const totalPages = computed(() => pages.value || 1)
const currentPage = computed({
    get: () => page.value,
    set: (value) => (page.value = value),
})

const selectCategory = (cat) => {
    selectedCategory.value = cat
    booksStore.setCategory(cat)
}

watch(searchQuery, (val) => {
    booksStore.debouncedSearch(val)
})

watch(
    () => [props.category, props.authorId, props.itemsPerPage],
    () => {
        booksStore.category = props.category
        booksStore.authorId = props.authorId
        booksStore.limit = props.itemsPerPage
        booksStore.loadBooks()
    }
)

onMounted(() => {
    booksStore.category = props.category
    booksStore.authorId = props.authorId
    booksStore.limit = props.itemsPerPage
    booksStore.loadBooks()
})
</script>
