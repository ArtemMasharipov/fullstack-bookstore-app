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
                <!-- Admin button removed in preparation for new admin panel -->
            </v-toolbar>

            <!-- Loading state -->
            <v-skeleton-loader
                v-if="booksLoading"
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
                <v-row>
                    <v-col
                        v-for="book in books"
                        :key="book._id"
                        cols="12"
                        sm="6"
                        md="4"
                        lg="3"
                        class="d-flex align-stretch"
                    >
                        <book-card
                            :book="book"
                            @click="viewDetails(book._id)"
                            @add-to-cart="addToCartSuccess"
                            class="w-100"
                        />
                    </v-col>
                </v-row>
            </v-container>

            <!-- Pagination -->
            <v-card-actions v-if="books.length && totalPages > 1" class="justify-center pa-4">
                <v-pagination
                    v-model="currentPage"
                    :length="totalPages"
                    :total-visible="isMobile ? 3 : 7"
                    @update:model-value="changePage"
                    rounded
                    color="primary"
                    active-color="primary"
                ></v-pagination>
            </v-card-actions>
        </v-card>
        <!-- Snackbars removed - now using Toast.vue component -->
    </div>
</template>

<script>
import { useAuthStore, useBooksStore, useBooksUiStore, useUiStore } from '@/store'
import { syncSuccess } from '@/utils'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import BookCard from './BookCard.vue'

/**
 * Component for displaying and managing a paginated list of books
 */
export default {
    name: 'BookList',
    components: {
        BookCard,
        LoadingSpinner,
    },

    props: {
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
    },

    data() {
        return {
            searchQuery: '',
            windowWidth: window.innerWidth,
        }
    },
    computed: {
        booksStore() {
            return useBooksStore()
        },

        booksUiStore() {
            return useBooksUiStore()
        },

        uiStore() {
            return useUiStore()
        },

        authStore() {
            return useAuthStore()
        },

        books() {
            return this.booksStore.booksList
        },

        booksLoading() {
            return this.booksStore.booksLoading
        },

        showForm() {
            return this.booksUiStore.showForm
        },

        selectedBook() {
            return this.booksUiStore.selectedBook
        },

        bookToDelete() {
            return this.booksUiStore.bookToDelete
        },

        formSubmitting() {
            return this.booksUiStore.formSubmitting
        },

        showDeleteDialog() {
            return this.booksUiStore.showDeleteDialog
        },

        filterParams() {
            return this.booksUiStore.filterParams
        },
        // UI store getters removed - now using notification system
        totalPages() {
            return this.booksStore.booksPagination?.pages || 1
        },

        /**
         * Check if the current viewport is mobile-sized
         */
        isMobile() {
            return this.windowWidth < 600
        },

        currentPage: {
            get() {
                return this.booksUiStore.currentPage
            },
            set(value) {
                this.booksUiStore.currentPage = value
            },
        },
    },

    watch: {
        filterParams: {
            handler() {
                this.loadBooks()
            },
            deep: true,
        },

        searchQuery(val) {
            this.booksUiStore.debouncedSearch(val)
        },

        // Watch for prop changes to update store
        category(val) {
            this.booksUiStore.category = val
        },

        authorId(val) {
            this.booksUiStore.authorId = val
        },

        itemsPerPage(val) {
            this.booksUiStore.itemsPerPage = val
        },
    },
    created() {
        try {
            // Initialize the store with props
            this.booksUiStore.initialize({
                category: this.category,
                authorId: this.authorId,
                itemsPerPage: this.itemsPerPage,
            })
            // Set up search debounce
            this.booksUiStore.setupSearchDebounce()

            // Add event listener for window resizing
            window.addEventListener('resize', this.handleResize)

            // Initial data fetch - wrapped in try/catch in loadBooks method
            this.loadBooks()
        } catch (error) {
            this.handleError(error.message || 'An error occurred while initializing the book list')
        }
    },

    beforeUnmount() {
        // Clean up event listener
        window.removeEventListener('resize', this.handleResize)
    },
    methods: {
        changePage(page) {
            return this.booksUiStore.changePage(page)
        },

        loadBooks() {
            return this.booksUiStore.loadBooks()
        },

        /**
         * Check if user has the specified permission
         * @param {string} permission - The permission to check
         * @returns {boolean} - Whether the user has the permission
         */

        /**
         * Track window width for responsive design
         */
        handleResize() {
            this.windowWidth = window.innerWidth
            // Also update the UI store
            this.uiStore.handleWindowResize()
        },

        /**
         * Navigate to book details page
         */
        viewDetails(bookId) {
            this.$router.push(`/books/${bookId}`)
        },

        /**
         * Handle successful cart addition
         */
        addToCartSuccess() {
            syncSuccess('Item added to cart successfully')
        },
    },
}
</script>
