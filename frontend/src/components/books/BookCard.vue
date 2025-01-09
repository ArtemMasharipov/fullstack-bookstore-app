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
            <p class="price">{{ book.price ? `${book.price} грн` : 'Price not available' }}</p>
            <p class="availability" :class="{ available: book.available }">
                {{ book.available ? '✔ In Stock' : '✖ Out of Stock' }}
            </p>
            <div class="card-actions">
                <button v-if="book.available" class="btn btn-primary" @click.stop="$emit('add-to-cart', book._id)">
                    Add to Cart
                </button>
                <button class="btn btn-edit" @click.stop="$emit('edit', book)">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-delete" @click.stop="$emit('delete', book._id)">
                    <i class="fas fa-trash"></i> Delete
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
    emits: ['add-to-cart', 'edit', 'delete'],
    data() {
        return {
            showDeleteConfirm: false
        }
    },
    methods: {
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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 100%; /* Адаптивная ширина */
    height: auto; /* Высота по содержимому */
    border: 1px solid var(--gray-light);
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
    padding: 1rem;
    width: 100%;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
}

.book-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: var(--secondary-color);
    margin: 0.5rem 0;
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

.card-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    justify-content: center;
}

.btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.btn-edit {
    background-color: #4caf50;
    color: white;
}

.btn-delete {
    background-color: #f44336;
    color: white;
}

.btn:hover {
    opacity: 0.9;
}

@media screen and (max-width: 768px) {
    .book-card {
        width: 100%;
    }
}
</style>
