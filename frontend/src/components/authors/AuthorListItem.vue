<template>
    <div 
        class="author-list-item" 
        role="button" 
        tabindex="0" 
        aria-label="View author details" 
        @click="handleClick"
        @keydown.enter="handleClick"
    >
        <div class="author-info">
            <h3 class="author-name">{{ author.name }}</h3>
            <p class="author-biography">{{ author.biography }}</p>
            <div class="book-count" aria-label="Number of books">Books: {{ author.books?.length || 0 }}</div>
        </div>
        <div 
            v-if="hasPermission('update:author') || hasPermission('delete:author')" 
            class="admin-actions"
            aria-label="Admin actions"
        >
            <button 
                v-if="hasPermission('update:author')" 
                class="btn btn-edit" 
                aria-label="Edit author"
                @click.stop="$emit('edit', author)"
            >
                Edit
            </button>
            <button
                v-if="hasPermission('delete:author')"
                class="btn btn-delete" 
                aria-label="Delete author"
                @click.stop="handleDelete"
            >
                Delete
            </button>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';

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
            this.$emit('click');
        },

        handleDelete() {
            const authorId = this.author._id;
            if (!authorId) {
                console.error('No author ID available:', this.author);
                return;
            }
            this.$emit('delete', authorId);
        },
    },
};
</script>

<style scoped>
.author-list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--gray-light);
    cursor: pointer;
    transition: background-color 0.3s ease, box-shadow 0.3s ease;
    border-radius: 0.5rem;
    outline: none;
}

.author-list-item:hover,
.author-list-item:focus {
    background-color: var(--gray-light);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.author-info {
    flex: 1;
    margin-right: 1rem;
}

.author-name {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--text-primary);
}

.author-biography {
    margin: 0;
    font-size: 1rem;
    color: var(--text-secondary);
    line-height: 1.5;
}

.book-count {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.5rem;
}

.admin-actions {
    display: flex;
    gap: 0.5rem;
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
    transition: background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    gap: 0.5rem;
}

.btn-edit {
    color: var(--primary-color);
    border-color: var(--primary-color);
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
</style>
