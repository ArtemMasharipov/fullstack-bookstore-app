<template>
    <div class="book-details-page">
        <loading-spinner v-if="loading" />

        <template v-else-if="book">
            <div class="breadcrumb"><router-link to="/books">Books</router-link> / {{ book.title }}</div>

            <div class="book-details">
                <div class="book-cover">
                    <img v-if="book.image" :src="book.image" :alt="book.title" />
                </div>

                <div class="book-info">
                    <h1>{{ book.title }}</h1>
                    <router-link :to="`/authors/${book.author.id}`" class="author-link">
                        {{ book.author.name }}
                    </router-link>

                    <div class="book-metadata">
                        <span>Published: {{ book.publicationYear }}</span>
                        <span v-if="book.category">Category: {{ book.category }}</span>
                    </div>

                    <div v-if="hasPermission('update:book') || hasPermission('delete:book')" class="action-buttons">
                        <button v-if="hasPermission('update:book')" class="btn btn-primary" @click="handleEdit">
                            Edit
                        </button>
                        <button v-if="hasPermission('delete:book')" class="btn btn-danger" @click="confirmDelete">
                            Delete
                        </button>
                    </div>
                </div>
            </div>

            <div v-if="relatedBooks.length" class="related-books">
                <h2>Related Books</h2>
                <div class="books-grid">
                    <book-card
                        v-for="relatedBook in relatedBooks"
                        :key="relatedBook.id"
                        :book="relatedBook"
                        @click="$router.push(`/books/${relatedBook.id}`)"
                    />
                </div>
            </div>
        </template>

        <error-message v-else-if="error" :message="error" />

        <modal v-if="showDeleteModalPage" @close="showDeleteModalPage = false" @confirm="handleDelete">
            <p>Are you sure you want to delete this book?</p>
        </modal>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BookCard from '@/components/books/BookCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

export default {
    name: 'BookDetails',

    components: {
        BookCard,
        LoadingSpinner,
        ErrorMessage,
    },

    props: {
        bookId: {
            type: String,
            required: true,
        },
    },

    emits: ['edit', 'delete'],

    data() {
        return {
            showDeleteModalPage: false,
        }
    },

    computed: {
        ...mapGetters('books', ['currentBook', 'loading', 'error']),
        ...mapGetters('auth', ['hasPermission']),
        book() {
            return this.currentBook
        },
        relatedBooks() {
            return this.book ? this.book.relatedBooks || [] : []
        },
    },

    created() {
        this.fetchBook(this.bookId)
    },

    methods: {
        ...mapActions('books', ['fetchBook', 'deleteBook', 'addToCart']),

        handleEdit() {
            this.$emit('edit', this.book)
        },

        confirmDelete() {
            this.showDeleteModalPage = true
        },

        async handleDelete() {
            try {
                await this.deleteBook(this.book.id)
                this.$router.push('/books')
            } catch (error) {
                console.error('Failed to delete book:', error)
            }
        },

        addToCart(book) {
            this.addToCart(book)
        },
    },
}
</script>

<style scoped>
.book-details-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.breadcrumb {
    margin-bottom: 2rem;

    a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.book-details {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

.book-cover {
    img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
}

.book-info {
    h1 {
        margin: 0 0 1rem;
        color: var(--secondary-color);
    }
}

.author-link {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 1.2rem;

    &:hover {
        text-decoration: underline;
    }
}

.book-metadata {
    margin: 1rem 0;
    display: flex;
    gap: 1rem;
    color: var(--gray-medium);
}

.action-buttons {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
}

.related-books {
    margin-top: 3rem;

    h2 {
        margin-bottom: 1.5rem;
        color: var(--secondary-color);
    }
}

.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem;
}
</style>
