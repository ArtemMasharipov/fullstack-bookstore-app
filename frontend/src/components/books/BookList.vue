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

        <div v-if="booksError" class="error-container">
            <error-message :message="booksError.message || booksError" />
        </div>

        <div v-if="errorMessage" class="error-container">
            <error-message :message="errorMessage" />
        </div>
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
            this.showForm = false;
        },

        async handleFormSubmit(formData) {
            try {
                if (formData.id) {
                    await this.updateBook({ id: formData.id, formData });
                } else {
                    await this.createBook(formData);
                }
                this.closeForm();
                await this.fetchBooks();
            } catch (error) {
                this.errorMessage = error.message || 'Failed to save book';
            }
        },

        handleError(message) {
            this.errorMessage = message;
        },

        async handleDelete(bookId) {
            console.log('BookList received delete event with ID:', bookId);
            this.errorMessage = null;

            try {
                if (!bookId) {
                    throw new Error('Cannot delete book: Missing book ID');
                }

                const bookToDelete = this.books.find(book => book._id === bookId);
                console.log('Found book to delete:', bookToDelete);

                if (!bookToDelete) {
                    throw new Error('Cannot delete book: Book not found');
                }

                await this.deleteBook(bookId);
                await this.fetchBooks();
            } catch (error) {
                console.error('Delete error:', error);
                this.errorMessage = error.message || 'Failed to delete book';
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
