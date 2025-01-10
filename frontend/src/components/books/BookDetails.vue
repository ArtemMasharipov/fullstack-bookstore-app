<template>
    <div class="book-details-page">
        <loading-spinner v-if="loading" />

        <template v-else-if="book">
            <div class="breadcrumb">
                <router-link to="/books">Books</router-link> / {{ book.title || 'Unknown Title' }}
            </div>

            <div class="book-details">
                <div class="book-cover">
                    <img :src="book.image || placeholderImage" :alt="book.title || 'No image available'" />
                </div>

                <div class="book-info">
                    <h1>{{ book.title || 'No Title' }}</h1>
                    <router-link v-if="book.author?.id" :to="`/authors/${book.author.id}`" class="author-link">
                        {{ book.author?.name || 'Unknown Author' }}
                    </router-link>

                    <div class="book-metadata">
                        <span>Published: {{ book.publicationYear || 'N/A' }}</span>
                        <span v-if="book.category">Category: {{ book.category }}</span>
                    </div>

                    <div class="book-price-section">
                        <span class="price">{{ formatPrice(book.price) }}</span>
                        <span :class="['stock-status', {'in-stock': book.inStock}]">
                            {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                        </span>
                    </div>

                    <p v-if="book.description" class="book-description">{{ book.description }}</p>

                    <div class="action-buttons">
                        <button 
                            v-if="book.inStock" 
                            class="btn btn-primary"
                            :disabled="loading"
                            @click="handleAddToCart"
                        >
                            Add to Cart
                        </button>
                        <button v-if="hasPermission('update:book')" class="btn btn-secondary" @click="handleEdit">
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
import { mapGetters, mapActions } from 'vuex';
import BookCard from '@/components/books/BookCard.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';

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

    emits: ['edit', 'delete', 'success', 'error'],

    data() {
        return {
            showDeleteModalPage: false,
            placeholderImage: '/images/placeholder.png', // Путь к плейсхолдеру
        };
    },

    computed: {
        ...mapGetters('books', ['currentBook', 'loading', 'error']),
        ...mapGetters('auth', ['hasPermission']),
        book() {
            return this.currentBook;
        },
        relatedBooks() {
            return this.book ? this.book.relatedBooks || [] : [];
        },
    },

    created() {
        this.fetchBook(this.bookId);
    },

    methods: {
        ...mapActions('books', ['fetchBook', 'deleteBook']),
        ...mapActions('cart', ['addToCart']),

        handleEdit() {
            this.$emit('edit', this.book);
        },

        confirmDelete() {
            this.showDeleteModalPage = true;
        },

        async handleDelete() {
            try {
                await this.deleteBook(this.book.id);
                this.$router.push('/books');
            } catch (error) {
                console.error('Failed to delete book:', error);
            }
        },

        async handleAddToCart() {
            if (!this.book.inStock) return
            
            try {
                await this.addToCart({
                    bookId: this.book._id,
                    quantity: 1,
                    price: this.book.price
                })
                this.$emit('success', 'Added to cart')
            } catch (error) {
                this.$emit('error', error.message)
            }
        },

        formatPrice(price) {
            return price ? `${price} грн` : 'Price not available'
        },
    },
};
</script>

<style scoped>
.book-details-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.breadcrumb {
    margin-bottom: 1rem;
    font-size: 1rem;
}

.breadcrumb a {
    color: var(--primary-color);
    text-decoration: none;
}

.breadcrumb a:hover {
    text-decoration: underline;
}

.book-details {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
    margin-bottom: 2rem;
}

.book-cover {
    flex: 1 1 300px;
    max-width: 300px;
    text-align: center;
}

.book-cover img {
    width: 100%;
    height: auto;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.book-info {
    flex: 2 1 600px;
}

.book-info h1 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    color: var(--secondary-color);
}

.author-link {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 1.2rem;
}

.author-link:hover {
    text-decoration: underline;
}

.book-metadata {
    margin: 1rem 0;
    font-size: 1rem;
    color: var(--gray-medium);
}

.book-price-section {
    margin: 1rem 0;
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.price {
    font-weight: bold;
    color: var(--primary-color);
}

.stock-status {
    font-size: 0.875rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.stock-status.in-stock {
    background-color: var(--success-light);
    color: var(--success);
}

.stock-status:not(.in-stock) {
    background-color: var(--danger-light);
    color: var(--danger);
}

.book-description {
    margin: 1rem 0;
    font-size: 1rem;
    line-height: 1.5;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.related-books {
    margin-top: 2rem;
}

.related-books h2 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
}

@media screen and (max-width: 768px) {
    .book-details {
        flex-direction: column;
    }

    .book-cover,
    .book-info {
        flex: 1 1 auto;
    }
}
</style>
