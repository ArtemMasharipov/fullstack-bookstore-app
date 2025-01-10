<template>
    <div class="book-card" @click="$emit('click', book.id)">
        <div class="book-image-container">
            <div class="book-image-wrapper">
                <img :src="book.image || placeholderImage" :alt="book.title || 'No image available'" class="book-image" />
            </div>
        </div>
        <div class="book-info">
            <h3 class="book-title">{{ book.title || 'No title' }}</h3>
            <p v-if="book.author?.name" class="author-name">{{ book.author.name }}</p>
            <p v-if="book.publicationYear" class="publication-year">Published: {{ book.publicationYear }}</p>
            <p v-if="book.category" class="category">Category: {{ book.category }}</p>
            <p v-if="book.description" class="description">{{ book.description }}</p>
            <div class="book-price">
                <span class="price">{{ formatPrice(book.price) }}</span>
                <span :class="['stock-status', {'in-stock': book.inStock}]">
                    {{ book.inStock ? '✔ In Stock' : '✖ Out of Stock' }}
                </span>
            </div>
            <div class="actions-container">
                <div class="admin-actions">
                    <button 
                        class="btn btn-edit" 
                        aria-label="Edit book"
                        @click.stop="$emit('edit', book)"
                    >
                        Edit
                    </button>
                    <button 
                        class="btn btn-delete" 
                        aria-label="Delete book"
                        @click.stop="$emit('delete', book)"
                    >
                        Delete
                    </button>
                </div>
                <button 
                    v-if="book.inStock" 
                    class="btn btn-cart" 
                    :disabled="loading || !hasPermission('create:cart')"
                    @click.stop="handleAddToCart"
                >
                    <span v-if="loading" class="spinner"></span>
                    <span v-else>Add to Cart</span>
                </button>
            </div>
        </div>
        <confirm-modal
            v-if="showDeleteConfirm"
            title="Delete Book"
            :message="`Are you sure you want to delete '${book.title}'?`"
            confirm-text="Delete"
            @confirm="confirmDelete"
            @cancel="showDeleteConfirm = false"
        />
    </div>
</template>

<script>
import ConfirmModal from '../common/ConfirmModal.vue'
import { mapActions, mapGetters } from 'vuex'

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
            default: '/images/placeholder.png', // Укажите путь к placeholder-изображению
        },
    },
    emits: ['add-to-cart', 'edit', 'delete', 'click', 'error', 'success'],
    data() {
        return {
            showDeleteConfirm: false,
            loading: false
        }
    },
    methods: {
        ...mapActions('cart', ['addToCart']),
        ...mapGetters('auth', ['hasPermission']),
        
        formatPrice(price) {
            return price ? `${price} грн` : 'Price not available'
        },

        async handleAddToCart() {
            if (!this.book.inStock) return
            
            this.loading = true
            try {
                await this.addToCart({
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
.book-card {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--border-color, #eee);
    max-width: 100%; /* Адаптивная ширина */
    height: auto; /* Высота по содержимому */
    margin: 1rem;
    position: relative;
    z-index: 1; /* Ниже чем у формы */
}

.book-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.book-image-container {
    width: 100%;
    aspect-ratio: 3 / 4; /* Отношение сторон изображения */
    overflow: hidden;
    background: var(--gray-light);
}

.book-image-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.book-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
}

.book-image:hover {
    transform: scale(1.05);
}

.book-info {
    padding: 1.5rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
}

.book-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
}

.author-name,
.publication-year,
.category,
.description,
.price,
.availability {
    font-size: 0.9rem;
    margin: 0.25rem 0;
}

.availability.available {
    color: green;
}

.availability:not(.available) {
    color: red;
}

.add-to-cart {
    background-color: var(--primary-color);
    color: var(--white);
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    margin-top: 0.5rem;
    width: 100%;
    transition: background-color 0.3s ease;
}

.add-to-cart:hover {
    background-color: var(--primary-dark);
}

.actions-container {
    margin-top: auto;
    padding: 1rem;
    border-top: 1px solid var(--gray-light);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.admin-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    width: 100%;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 0.5rem;
}

.btn-edit {
    color: var(--primary-color);
    border-color: var(--primary-color);
    background: transparent;
}

.btn-edit::before {
    content: '\270E';
    font-size: 1rem;
}

.btn-edit:hover {
    background-color: var(--primary-color-light);
    border-color: var(--primary-color-dark);
    box-shadow: 0 2px 8px rgba(4, 101, 13, 0.2);
}

.btn-delete {
    color: rgb(216, 45, 45);
    border-color: var(--danger-color);
    background: transparent;
}

.btn-delete::before {
    content: '\1F5D1';
    font-size: 1rem;
}

.btn-delete:hover {
    background-color: var(--danger-color-light);
    border-color: var(--danger-color-dark);
    box-shadow: 0 2px 8px rgba(255, 77, 77, 0.5);
}

.btn-cart {
    color: white;
    background-color: var(--primary-color);
    padding: 0.5rem 2rem;
}

.btn-cart::before {
    content: '\1F6D2';
    font-size: 1rem;
    margin-right: 0.5rem;
}

.btn-cart:hover {
    background-color: var(--primary-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.icon {
    font-size: 1.1rem;
    line-height: 1;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    border: 1px solid transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 0.5rem;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
    border: none;
}

.btn-primary:hover {
    background-color: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn-edit {
    color: var(--primary-color);
    border-color: var(--primary-color);
    background: transparent;
}

.btn-edit::before {
    content: '\270E';
    font-size: 1rem;
}

.btn-edit:hover {
    background-color: var(--primary-color-light);
    border-color: var(--primary-color-dark);
    box-shadow: 0 2px 8px rgba(4, 101, 13, 0.2);
}

.btn-delete {
    color: rgb(216, 45, 45);
    border-color: var(--danger-color);
    background: transparent;
}

.btn-delete::before {
    content: '\1F5D1';
    font-size: 1rem;
}

.btn-delete:hover {
    background-color: var(--danger-color-light);
    border-color: var(--danger-color-dark);
    box-shadow: 0 2px 8px rgba(255, 77, 77, 0.5);
}

.btn:hover {
    transform: translateY(-1px);
}

.btn i {
    font-size: 1rem;
}

@media screen and (max-width: 768px) {
    .book-card {
        width: 100%;
    }
}
</style>
