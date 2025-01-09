<template>
    <div class="book-list">
        <button @click="openCreateForm">Create New Book</button>
        
        <book-form
            v-if="showForm"
            :initial-data="selectedBook"
            :loading="booksLoading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <div v-if="booksLoading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else class="books-grid">
            <book-card
                v-for="book in books"
                :key="book._id"
                :book="book"
                @edit="openEditForm"
                @delete="handleDelete"
                @error="handleError"
            />
        </div>

        <error-message 
            v-if="errorMessage || booksError" 
            :message="errorMessage || booksError?.message || booksError" 
        />
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BookCard from './BookCard.vue'
import BookForm from './BookForm.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'

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
            errorMessage: null
        };
    },

    computed: {
        ...mapGetters('books', ['booksList', 'booksLoading', 'booksError']),
        books() {
            return this.booksList
        }
    },

    created() {
        this.fetchBooks()
    },

    methods: {
        ...mapActions('books', ['fetchBooks', 'createBook', 'updateBook', 'deleteBook']),

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
            this.errorMessage = null;

            try {
                if (!bookId || !this.books.find(book => book._id === bookId)) {
                    throw new Error('Cannot delete: Book not found');
                }

                await this.deleteBook(bookId);
                await this.fetchBooks();
            } catch (error) {
                this.errorMessage = error.message;
            }
        },
    },
}
</script>

<style scoped>
.book-list {
    padding: 1rem;
}

.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.error-container {
    max-width: 600px;
    margin: 2rem auto;
}
</style>
