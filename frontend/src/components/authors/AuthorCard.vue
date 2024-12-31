<template>
    <div class="author-card" @click="handleClick">
        <div v-if="author.avatar" class="author-image">
            <img :src="author.avatar" :alt="author.name" />
        </div>
        <div class="author-info">
            <h3>{{ author.name }}</h3>
            <p>{{ author.biography }}</p>
            <div class="book-count">Books: {{ author.books?.length || 0 }}</div>
            <div v-if="hasPermission('update:author') || hasPermission('delete:author')" class="admin-actions">
                <button v-if="hasPermission('update:author')" class="btn-edit" @click.stop="$emit('edit', author)">
                    Edit
                </button>
                <button
                    v-if="hasPermission('delete:author')"
                    class="btn-delete"
                    @click.stop="$emit('delete', author.id)"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'AuthorCard',
    props: {
        author: {
            type: Object,
            required: true,
        },
    },
    emits: ['click', 'edit', 'delete'],
    computed: {
        ...mapGetters('auth', ['hasPermission']),
    },
    methods: {
        handleClick() {
            this.$emit('click')
        },
    },
}
</script>

<style scoped>
.author-card {
    background: var(--white);
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s ease;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.author-card:hover {
    transform: translateY(-5px);
}

.author-image {
    height: 200px;
    overflow: hidden;
}

.author-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.author-info {
    padding: 1rem;
}

.author-info h3 {
    margin: 0 0 0.5rem;
    color: var(--secondary-color);
}

.book-count {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: var(--primary-color);
}

.admin-actions {
    margin-top: 1rem;
    display: flex;
    gap: 0.5rem;
}

.btn-edit,
.btn-delete {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.btn-edit {
    background-color: var(--primary-color);
    color: var(--white);
}

.btn-delete {
    background-color: var(--error-color);
    color: var(--white);
}
</style>
