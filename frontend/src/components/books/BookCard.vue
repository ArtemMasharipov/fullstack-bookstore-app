<template>
    <v-card 
        class="book-card" 
        @click="$emit('click', book.id)"
        elevation="2" 
        height="100%"
        hover
    >
        <v-img
            :src="book.image || placeholderImage"
            :alt="book.title || 'No image available'" 
            class="book-image"
            height="280"
            cover
        ></v-img>
        
        <v-card-item>
            <v-card-title class="text-truncate">
                {{ book.title || 'No title' }}
            </v-card-title>
            
            <v-card-subtitle v-if="book.author?.name">
                {{ book.author.name }}
            </v-card-subtitle>
        </v-card-item>
        
        <v-card-text>
            <div v-if="book.publicationYear" class="text-caption mb-1">
                Published: {{ book.publicationYear }}
            </div>
            
            <div v-if="book.category" class="text-caption mb-1">
                Category: {{ book.category }}
            </div>
            
            <div v-if="book.description" class="text-body-2 my-1 text-truncate-2">
                {{ book.description }}
            </div>
            
            <div class="d-flex align-center justify-space-between mt-3">
                <div class="text-subtitle-1 font-weight-bold">
                    {{ formatPrice(book.price) }}
                </div>
                
                <v-chip
                    :color="book.inStock ? 'success' : 'error'"
                    size="small"
                    variant="tonal"
                >
                    {{ book.inStock ? 'In Stock' : 'Out of Stock' }}
                </v-chip>
            </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-2">
            <div class="d-flex flex-column w-100 gap-2">
                <div class="d-flex justify-space-between w-100">
                    <v-btn 
                        variant="outlined"
                        color="primary"
                        density="comfortable"
                        prepend-icon="mdi-pencil"
                        class="flex-grow-1 me-2"
                        @click.stop="$emit('edit', book)"
                    >
                        Edit
                    </v-btn>
                    
                    <v-btn 
                        variant="outlined"
                        color="error"
                        density="comfortable"
                        prepend-icon="mdi-delete"
                        class="flex-grow-1"
                        @click.stop="showDeleteConfirm = true"
                    >
                        Delete
                    </v-btn>
                </div>
                
                <v-btn
                    v-if="book.inStock"
                    color="primary"
                    block
                    prepend-icon="mdi-cart"
                    :disabled="loading || !authStore.hasPermission('create:cart')"
                    :loading="loading"
                    @click.stop="handleAddToCart"
                >
                    Add to Cart
                </v-btn>
            </div>
        </v-card-actions>
        
        <confirm-modal
            v-model="showDeleteConfirm"
            title="Delete Book"
            :message="`Are you sure you want to delete '${book.title}'?`"
            confirm-text="Delete"
            @confirm="confirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </v-card>
</template>

<script>
import { useAuthStore, useCartStore } from '@/stores';
import ConfirmModal from '../common/ConfirmModal.vue';

export default {
    name: 'BookCard',
    components: {
        ConfirmModal
    },
    props: {
        book: {
            type: Object,
            required: true,
        },
        placeholderImage: {
            type: String,
            default: '/images/placeholder.png',
        },
    },
    emits: ['add-to-cart', 'edit', 'delete', 'click', 'error', 'success'],
    data() {
        return {
            showDeleteConfirm: false,
            loading: false
        }
    },
    computed: {
        cartStore() {
            return useCartStore();
        },
        authStore() {
            return useAuthStore();
        }
    },
    methods: {
        formatPrice(price) {
            return price ? `${price} грн` : 'Price not available'
        },

        async handleAddToCart() {
            if (!this.book.inStock) return
            
            this.loading = true
            try {
                await this.cartStore.addToCart({
                    bookId: this.book._id,
                    quantity: 1,
                    price: this.book.price
                })
                this.$emit('success', 'Added to cart')
            } catch (error) {
                this.$emit('error', error.message)
            } finally {
                this.loading = false
            }
        },
        confirmDelete() {
            this.$emit('delete', this.book._id);
            this.showDeleteConfirm = false;
        }
    }
};
</script>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
