<template>
    <div class="book-list">
        <button @click="openCreateForm">Create New Book</button>
        
        <book-form
            v-if="showForm"
            :initial-data="selectedBook"
            :loading="loading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <div v-if="loading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else class="books-grid">
            <book-card
                v-for="book in books"
                :key="book.id"
                :book="book"
                @edit="openEditForm(book)"
                @delete="deleteBook(book.id)"
            />
        </div>

        <div v-if="error" class="error-container">
            <error-message :message="error" />
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
            loading: false,
            error: null,
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

        openEditForm(book) {
            this.selectedBook = book;
            this.showForm = true;
        },

        closeForm() {
            this.showForm = false;
        },

        async handleFormSubmit(formData) {
            this.loading = true;
            try {
                if (formData.id) {
                    await this.updateBook(formData);
                } else {
                    await this.createBook(formData);
                }
                this.closeForm();
                this.fetchBooks();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
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
