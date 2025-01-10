<template>
    <div class="book-list">
        <div class="content-container">
            <div class="header-section">
                <h2 class="section-title">Books</h2>
                <button class="create-button" @click="openCreateForm">
                    <span class="button-icon">+</span> Create New Book
                </button>
            </div>

            <hr class="divider">

            <div class="list-section">
                <div v-if="booksLoading" class="loading-container">
                    <loading-spinner />
                </div>

                <div v-else-if="!books.length" class="empty-state">
                    <p>No books found. Add your first book!</p>
                </div>

                <div v-else class="books-grid">
                    <book-card v-for="book in books" :key="book._id" :book="book"
                        @edit="openEditForm" @delete="handleDeleteClick" @error="handleError" />
                </div>
            </div>
        </div>

        <book-form
            v-if="showForm"
            :initial-data="selectedBook"
            :loading="booksLoading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

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
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.content-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.header-section {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.section-title {
    font-size: 1.5rem;
    color: var(--text-primary);
    margin: 0;
    font-weight: 600;
}

.divider {
    margin: 0;
    border: none;
    border-top: 1px solid var(--border-color, #eee);
}

.list-section {
    padding: 2rem;
}

.create-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
}

.button-icon {
    font-size: 1.2em;
    line-height: 1;
}

.create-button:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
}

.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
}

.list-header h1 {
    font-size: 2rem;
    color: var(--text-primary);
    margin: 0;
}

.empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-secondary);
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 3rem;
}

.error-container {
    max-width: 600px;
    margin: 1rem auto;
}

.btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.btn-primary:hover {
    background-color: var(--primary-dark);
}

@media (max-width: 768px) {
    .book-list {
        padding: 1rem;
    }

    .header-section {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        padding: 1rem;
    }

    .list-section {
        padding: 1rem;
    }
}
</style>
