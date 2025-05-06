<template>
    <div>
        <v-card flat class="mb-4">
            <v-toolbar 
                color="primary" 
                flat 
                rounded="0"
                elevation="1"
            >
                <v-toolbar-title class="text-white font-weight-medium">
                    Books
                </v-toolbar-title>
                
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
                    style="max-width: 250px;"
                    clearable
                    @update:model-value="debounceSearch"
                ></v-text-field>
                
                <v-btn
                    color="white"
                    variant="outlined"
                    prepend-icon="mdi-plus"
                    @click="openCreateForm"
                    :disabled="booksLoading"
                    class="ml-2"
                >
                    Create New Book
                </v-btn>
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
                    color="primary"
                    variant="text"
                    density="comfortable"
                    @click="openCreateForm"
                    prepend-icon="mdi-plus"
                >
                    Add your first book
                </v-btn>
            </v-alert>

            <!-- Books grid -->
            <v-container v-else fluid class="py-2">
                <v-row>
                    <v-col 
                        v-for="book in books" 
                        :key="book._id" 
                        cols="12" sm="6" md="4" lg="3"
                        class="d-flex align-stretch"
                    >
                        <book-card 
                            :book="book"
                            @click="viewDetails(book._id)"
                            @edit="openEditForm" 
                            @delete="handleDeleteClick"
                            @add-to-cart="addToCartSuccess"
                            @error="handleError" 
                            @success="showSnackbar"
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

        <!-- Create/Edit form modal -->
        <book-form
            v-if="showForm"
            v-model="showForm"
            :initial-data="selectedBook"
            :loading="formSubmitting"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <!-- Delete confirmation -->
        <confirm-modal
            v-model="showDeleteDialog"
            title="Delete Book"
            :message="`Are you sure you want to delete '${bookToDelete?.title || 'this book'}'?`"
            confirm-text="Delete"
            confirm-color="error"
            icon="mdi-delete-alert"
            @confirm="handleDelete"
        />

        <!-- Feedback snackbars -->
        <v-snackbar
            v-model="showSuccessSnackbar"
            color="success"
            :timeout="3000"
        >
            {{ successMessage }}
            <template v-slot:actions>
                <v-btn
                    variant="text"
                    icon="mdi-close"
                    @click="showSuccessSnackbar = false"
                ></v-btn>
            </template>
        </v-snackbar>

        <v-snackbar
            v-model="hasError"
            color="error"
            timeout="5000"
        >
            {{ errorMessage }}
            <template v-slot:actions>
                <v-btn
                    variant="text"
                    icon="mdi-close"
                    @click="hasError = false"
                ></v-btn>
            </template>
        </v-snackbar>
    </div>
</template>

<script>
import { useBooksStore } from '@/stores';
import { debounce } from 'lodash';
import LoadingSpinner from '../common/LoadingSpinner.vue';
import BookCard from './BookCard.vue';
import BookForm from './BookForm.vue';
import ConfirmModal from '../common/ConfirmModal.vue';

/**
 * Component for displaying and managing a paginated list of books
 */
export default {
    name: 'BookList',

    components: {
        BookCard,
        BookForm,
        LoadingSpinner,
        ConfirmModal
    },

    props: {
        /**
         * Optional category filter
         */
        category: {
            type: String,
            default: null
        },
        
        /**
         * Optional author filter
         */
        authorId: {
            type: String,
            default: null
        },
        
        /**
         * Number of items to display per page
         */
        itemsPerPage: {
            type: Number,
            default: 12
        }
    },

    data() {
        return {
            showForm: false,
            selectedBook: null,
            errorMessage: null,
            hasError: false,
            bookToDelete: null,
            currentPage: 1,
            formSubmitting: false,
            searchQuery: '',
            showSuccessSnackbar: false,
            successMessage: '',
            windowWidth: window.innerWidth
        };
    },

    computed: {
        booksStore() {
            return useBooksStore();
        },
        
        books() {
            return this.booksStore.booksList || [];
        },
        
        totalPages() {
            return this.booksStore.pagination?.pages || 1;
        },
        
        booksLoading() {
            return this.booksStore.loading;
        },
        
        showDeleteDialog: {
            get() {
                return !!this.bookToDelete;
            },
            set(value) {
                if (!value) this.bookToDelete = null;
            }
        },
        
        /**
         * Check if the current viewport is mobile-sized
         */
        isMobile() {
            return this.windowWidth < 600;
        },
        
        /**
         * Construct filter parameters for API calls
         */
        filterParams() {
            const params = {
                page: this.currentPage,
                limit: this.itemsPerPage
            };
            
            if (this.searchQuery) {
                params.search = this.searchQuery;
            }
            
            if (this.category) {
                params.category = this.category;
            }
            
            if (this.authorId) {
                params.author = this.authorId;
            }
            
            return params;
        }
    },

    watch: {
        errorMessage(val) {
            this.hasError = !!val;
        },
        
        // Reload books when filter props change
        filterParams: {
            handler() {
                this.fetchBooks();
            },
            deep: true
        }
    },

    created() {
        // Initialize debounced search function
        this.debounceSearch = debounce(() => {
            this.currentPage = 1; // Reset to page 1 on search
            this.fetchBooks();
        }, 500);
        
        // Set window resize event listener
        window.addEventListener('resize', this.handleResize);
        
        // Initial data fetch
        this.fetchBooks();
    },
    
    beforeUnmount() {
        // Clean up event listener
        window.removeEventListener('resize', this.handleResize);
    },

    methods: {
        /**
         * Track window width for responsive design
         */
        handleResize() {
            this.windowWidth = window.innerWidth;
        },
        
        /**
         * Show success snackbar with message
         */
        showSnackbar(message) {
            this.successMessage = message;
            this.showSuccessSnackbar = true;
        },
        
        /**
         * Navigate to book details page
         */
        viewDetails(bookId) {
            this.$router.push(`/books/${bookId}`);
        },
        
        /**
         * Handle successful cart addition
         */
        addToCartSuccess() {
            this.showSnackbar('Item added to cart successfully');
        },
        
        /**
         * Open create book modal
         */
        openCreateForm() {
            this.selectedBook = {};
            this.showForm = true;
        },

        /**
         * Open edit book modal
         */
        async openEditForm(book) {
            this.selectedBook = { ...book };
            this.showForm = true;
        },

        /**
         * Close form modal
         */
        closeForm() {
            this.selectedBook = null;
            this.showForm = false;
        },

        /**
         * Handle form submission
         */
        async handleFormSubmit(bookData) {
            try {
                this.formSubmitting = true;
                
                if (bookData._id) {
                    await this.booksStore.updateBook(bookData);
                    this.showSnackbar('Book updated successfully');
                } else {
                    await this.booksStore.createBook(bookData);
                    this.showSnackbar('Book created successfully');
                }
                
                await this.fetchBooks();
                this.closeForm();
            } catch (error) {
                this.errorMessage = error.message || 'Failed to save book';
            } finally {
                this.formSubmitting = false;
            }
        },

        /**
         * Handle error display
         */
        handleError(message) {
            this.errorMessage = message;
        },

        /**
         * Delete book after confirmation
         */
        async handleDelete() {
            if (!this.bookToDelete?._id) return;
            
            try {
                await this.booksStore.deleteBook(this.bookToDelete._id);
                this.showSnackbar(`'${this.bookToDelete.title}' was deleted successfully`);
                this.bookToDelete = null;
                await this.fetchBooks();
            } catch (error) {
                this.errorMessage = error?.message || 'Failed to delete book';
            }
        },

        /**
         * Show delete confirmation dialog
         */
        handleDeleteClick(book) {
            this.bookToDelete = book;
        },

        /**
         * Handle page change
         */
        changePage(page) {
            this.currentPage = page;
            this.fetchBooks();
        },

        /**
         * Fetch books from API with current filters
         */
        async fetchBooks() {
            try {
                await this.booksStore.fetchBooks(this.filterParams);
            } catch (error) {
                this.errorMessage = error.message || 'Failed to load books';
            }
        }
    }
};
</script>
