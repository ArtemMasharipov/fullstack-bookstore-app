<template>
    <div class="author-list-item" @click="handleClick">
        <div class="author-info">
            <h3>{{ author.name }}</h3>
            <p>{{ author.biography }}</p>
            <div class="book-count">Books: {{ author.books?.length || 0 }}</div>
        </div>
        <div v-if="hasPermission('update:author') || hasPermission('delete:author')" class="admin-actions">
            <button v-if="hasPermission('update:author')" class="btn-edit" @click.stop="$emit('edit', author)">
                Edit
            </button>
            <button
                v-if="hasPermission('delete:author')"
                class="btn-delete"
                @click.stop="handleDelete"
            >
                Delete
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
    name: 'AuthorListItem',
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
        handleDelete() {
            const authorId = this.author._id
            if (!authorId) {
                console.error('No author ID available:', this.author)
                return
            }
            console.log('Deleting author:', authorId) // Debug
            this.$emit('delete', authorId)
        }
    },
}
</script>

<style scoped>
.author-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--gray-light);
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.author-list-item:hover {
    background-color: var(--gray-light);
}

.author-info {
    flex: 1;
}

.author-info h3 {
    margin: 0 0 0.5rem;
}

.admin-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-edit,
.btn-delete {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--primary-color);
}

.btn-delete {
    color: var(--danger-color);
}
</style>