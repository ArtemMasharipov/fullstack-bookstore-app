<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <loading-spinner />
        </div>

        <v-container v-else-if="book">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-row>
                <v-col cols="12" sm="4" md="3">
                    <v-img
                        :src="book.image || placeholderImage"
                        :alt="book.title || 'No image available'"
                        aspect-ratio="3/4"
                        cover
                        class="rounded elevation-3"
                    ></v-img>
                </v-col>

                <v-col cols="12" sm="8" md="9">
                    <h1 class="text-h4 mb-2">{{ book.title || 'No Title' }}</h1>
                    
                    <v-btn
                        v-if="book.author?.id"
                        :to="`/authors/${book.author.id}`"
                        variant="text"
                        color="primary"
                        class="px-0 mb-4 text-h6"
                    >
                        {{ book.author?.name || 'Unknown Author' }}
                    </v-btn>

                    <v-row class="mb-3">
                        <v-col cols="auto">
                            <v-chip size="small" color="secondary" variant="tonal">
                                Published: {{ book.publicationYear || 'N/A' }}
                            </v-chip>
                        </v-col>
                        
                        <v-col v-if="book.category" cols="auto">
                            <v-chip size="small" color="secondary" variant="tonal">
                                Category: {{ book.category }}
                            </v-chip>
                        </v-col>
                    </v-row>

                    <div class="d-flex align-center mb-4">
                        <div class="text-h5 font-weight-bold primary--text mr-4">
                            {{ formatPrice(book.price) }}
                        </div>
                        
                        <v-chip
                            :color="book.inStock ? 'success' : 'error'"
                            size="small"
                        >
                            {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                        </v-chip>
                    </div>

                    <v-card v-if="book.description" variant="outlined" class="mb-4 bg-grey-lighten-4">
                        <v-card-text>
                            {{ book.description }}
                        </v-card-text>
                    </v-card>

                    <v-row>
                        <v-col cols="12" md="6">
                            <v-btn
                                v-if="book.inStock"
                                color="primary"
                                block
                                :loading="loading"
                                @click="handleAddToCart"
                                prepend-icon="mdi-cart-plus"
                            >
                                Add to Cart
                            </v-btn>
                        </v-col>
                        
                        <v-col v-if="hasPermission('update:book')" cols="6" md="3">
                            <v-btn
                                color="secondary"
                                variant="outlined"
                                block
                                @click="handleEdit"
                                prepend-icon="mdi-pencil"
                            >
                                Edit
                            </v-btn>
                        </v-col>
                        
                        <v-col v-if="hasPermission('delete:book')" cols="6" md="3">
                            <v-btn
                                color="error"
                                variant="outlined"
                                block
                                @click="confirmDelete"
                                prepend-icon="mdi-delete"
                            >
                                Delete
                            </v-btn>
                        </v-col>
                    </v-row>
                </v-col>
            </v-row>

            <v-divider class="my-6"></v-divider>

            <v-row v-if="relatedBooks && relatedBooks.length > 0">
                <v-col cols="12">
                    <h2 class="text-h5 mb-4">Related Books</h2>
                    
                    <v-slide-group v-if="!loading" show-arrows>
                        <v-slide-group-item
                            v-for="(relatedBook, index) in relatedBooks"
                            :key="relatedBook?.id || `related-book-${index}`"
                            v-slot="{ isSelected, toggle, selectedClass }"
                        >
                            <div class="pa-2">
                                <book-card
                                    v-if="relatedBook"
                                    :book="relatedBook"
                                    @click="navigateToBook(relatedBook)"
                                />
                            </div>
                        </v-slide-group-item>
                    </v-slide-group>
                </v-col>
            </v-row>
        </v-container>

        <v-alert
            v-else-if="error"
            type="error"
            variant="tonal"
            class="mx-auto my-6"
            max-width="800"
        >
            {{ error }}
        </v-alert>

        <v-dialog v-model="showDeleteModalPage" max-width="400">
            <v-card>
                <v-card-title class="text-h5">Delete Book</v-card-title>
                <v-card-text>
                    <p>Are you sure you want to delete this book?</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="showDeleteModalPage = false">Cancel</v-btn>
                    <v-btn color="error" @click="handleDelete">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BookCard from '@/components/books/BookCard.vue';
import ErrorMessage from '@/components/common/ErrorMessage.vue';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import { useAuthStore, useBooksStore, useCartStore } from '@/stores';

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
            placeholderImage: '/images/placeholder.png',
        };
    },

    computed: {
        booksStore() {
            return useBooksStore();
        },
        authStore() {
            return useAuthStore();
        },
        cartStore() {
            return useCartStore();
        },
        currentBook() {
            return this.booksStore.currentBook;
        },
        loading() {
            return this.booksStore.loading;
        },
        error() {
            return this.booksStore.error;
        },
        hasPermission() {
            return this.authStore.hasPermission;
        },
        book() {
            return this.currentBook;
        },
        relatedBooks() {
            return this.book ? this.book.relatedBooks || [] : [];
        },
        breadcrumbItems() {
            return [
                {
                    title: 'Books',
                    to: '/books',
                },
                {
                    title: this.book?.title || 'Unknown Title',
                    disabled: true,
                },
            ];
        },
    },

    created() {
        this.fetchBook(this.bookId);
    },

    methods: {
        fetchBook(id) {
            return this.booksStore.fetchBookById(id);
        },
        deleteBook(id) {
            return this.booksStore.deleteBook(id);
        },
        addToCart(item) {
            return this.cartStore.addToCart(item);
        },
        
        handleEdit() {
            this.$emit('edit', this.book);
        },

        confirmDelete() {
            this.showDeleteModalPage = true;
        },        async handleDelete() {
            try {
                await this.deleteBook(this.book.id);
                this.$router.push('/books');
            } catch (error) {
                // Error is already handled by the store
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
        
        navigateToBook(book) {
            // Prevent navigation if we're already on this book
            if (book.id === this.bookId) return;
            
            // Navigate to the new book and refresh the page
            this.$router.push(`/books/${book.id}`);
            // Fetch the new book data
            this.fetchBook(book.id);
        },
    },
};
</script>
