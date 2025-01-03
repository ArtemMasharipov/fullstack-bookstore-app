<template>
    <div class="book-card" @click="$emit('click')">
        <div v-if="book.image" class="book-image">
            <img :src="book.image" :alt="book.title" />
        </div>
        <div class="book-info">
            <h3>{{ book.title }}</h3>
            <p>{{ book.author.name }}</p>
            <p class="year">{{ book.publicationYear }}</p>
            <span v-if="book.category" class="category">{{ book.category }}</span>
        </div>
    </div>
</template>

<script>
export default {
    name: 'BookCard',
    props: {
        book: {
            type: Object,
            required: true,
        },
    },
    emits: ['click'], // Declare the "click" event
}
</script>

<style scoped>
.book-card {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.book-card:hover {
    transform: translateY(-5px);
}

.book-image {
    height: 200px;
    overflow: hidden;
}

.book-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.book-info {
    padding: 1rem;
}

.book-info h3 {
    margin: 0;
    font-size: 1.2rem;
    color: var (--secondary-color);
}

.year {
    color: var(--gray-medium);
    font-size: 0.9rem;
}

.category {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    background-color: var(--primary-color);
    color: var(--white);
    border-radius: 4px;
    font-size: 0.8rem;
}
</style>
