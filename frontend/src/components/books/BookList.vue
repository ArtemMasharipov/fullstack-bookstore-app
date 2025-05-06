<template>
    <div>
        <v-card class="mb-4">
            <v-toolbar color="primary" flat>
                <v-toolbar-title class="text-h5 font-weight-medium white--text">Books</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn
                    color="white"
                    variant="outlined"
                    prepend-icon="mdi-plus"
                    @click="openCreateForm"
                >
                    Create New Book
                </v-btn>
            </v-toolbar>

            <div v-if="booksLoading" class="text-center py-8">
                <loading-spinner />
            </div>

            <v-alert 
                v-else-if="!books.length" 
                type="info" 
                variant="tonal" 
                class="ma-4 text-center"
            >
                No books found. Add your first book!
            </v-alert>

            <v-container v-else fluid>
                <v-row>
                    <v-col 
                        v-for="book in books" 
                        :key="book._id" 
                        cols="12" sm="6" md="4" lg="3"
                    >
                        <book-card 
                            :book="book"
                            @edit="openEditForm" 
                            @delete="handleDeleteClick" 
                            @error="handleError" 
                        />
                    </v-col>
                </v-row>
            </v-container>

            <v-divider v-if="books.length"></v-divider>

            <v-card-actions v-if="books.length" class="justify-center py-3">
                <v-pagination
                    v-model="currentPage"
                    :length="totalPages"
                    :total-visible="5"
                    @update:model-value="changePage"
                    rounded
                ></v-pagination>
            </v-card-actions>
        </v-card>

        <book-form
            v-if="showForm"
            :initial-data="selectedBook"
            :loading="booksLoading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <v-snackbar
            v-model="hasError"
            color="error"
            timeout="5000"
        >
            {{ errorMessage }}
            <template v-slot:actions>
                <v-btn
                    variant="text"
                    @click="hasError = false"
                >
                    Close
                </v-btn>
            </template>
        </v-snackbar>

        <v-dialog v-model="showDeleteDialog" max-width="400">
            <v-card v-if="bookToDelete">
                <v-card-title class="text-h5">Delete Book</v-card-title>
                <v-card-text>
                    Are you sure you want to delete '{{ bookToDelete.title }}'?
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="bookToDelete = null">Cancel</v-btn>
                    <v-btn color="error" @click="handleDelete(bookToDelete._id)">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import { useBooksStore } from '@/stores'
import ErrorMessage from '../common/ErrorMessage.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import BookCard from './BookCard.vue'
import BookForm from './BookForm.vue'

export default {
    name: 'BookList',

    components: {
        BookCard,
        BookForm,
        LoadingSpinner,
        ErrorMessage,
    },

    data() {
        return {
            showForm: false,
            selectedBook: null,
            errorMessage: null,
            hasError: false,
            bookToDelete: null,
            currentPage: 1,
            itemsPerPage: 12
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
        }
    },

    watch: {
        errorMessage(val) {
            this.hasError = !!val;
        }
    },

    created() {
        this.fetchBooks({ page: this.currentPage, limit: this.itemsPerPage });
    },

    methods: {
        openCreateForm() {
            this.selectedBook = {};
            this.showForm = true;
        },

        async openEditForm(book) {
            this.selectedBook = { ...book };
            this.showForm = true;
        },

        closeForm() {
            this.selectedBook = null;
            this.showForm = false;
        },

        async handleFormSubmit() {
            try {
                await this.fetchBooks(); // Only refresh the list after form submission
                this.closeForm();
            } catch (error) {
                this.errorMessage = error.message || 'Failed to save book';
            }
        },

        handleError(message) {
            this.errorMessage = message;
        },

        async handleDelete(bookId) {
            if (!bookId) return;
            
            try {
                await this.booksStore.deleteBook(bookId);
                this.bookToDelete = null;
                await this.fetchBooks();
            } catch (error) {
                this.errorMessage = error?.message || 'Failed to delete book';
            }
        },

        handleDeleteClick(book) {
            this.bookToDelete = book;
        },

        async changePage(page) {
            this.currentPage = page;
            await this.fetchBooks({ 
                page: this.currentPage, 
                limit: this.itemsPerPage 
            });
        },

        async fetchBooks(params) {
            try {
                await this.booksStore.fetchBooks(params || {
                    page: this.currentPage, 
                    limit: this.itemsPerPage
                });
            } catch (error) {
                this.errorMessage = error.message;
            }
        }
    },
}
</script>
