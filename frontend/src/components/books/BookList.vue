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
                @delete="handleDeleteClick"
                @error="handleError"
            />
        </div>

        <error-message 
            v-if="errorMessage" 
            :message="errorMessage" 
            @close="errorMessage = null"
        />

        <confirm-modal
            v-if="bookToDelete"
            title="Delete Book"
            :message="`Are you sure you want to delete '${bookToDelete.title}'?`"
            confirm-text="Delete"
            @confirm="handleDelete(bookToDelete._id)"
            @cancel="bookToDelete = null"
        />
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BookCard from './BookCard.vue'
import BookForm from './BookForm.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'
import ConfirmModal from '../common/ConfirmModal.vue'

export default {
    name: 'BookList',

    components: {
        BookCard,
        BookForm,
        LoadingSpinner,
        ErrorMessage,
        ConfirmModal,
    },

    data() {
        return {
            showForm: false,
            selectedBook: null,
            errorMessage: null,
            bookToDelete: null
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
            if (!bookId) return;
            
            try {
                await this.deleteBook(bookId);
                this.bookToDelete = null;
                await this.fetchBooks();
            } catch (error) {
                this.errorMessage = error?.message || 'Failed to delete book';
            }
        },

        handleDeleteClick(book) {
            this.bookToDelete = book;
        },

        async confirmDelete() {
            try {
                await this.deleteBook(this.bookToDelete._id);
                await this.fetchBooks();
                this.bookToDelete = null;
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
