<template>
    <div 
        class="author-list-item" 
        @click="handleClick" 
        role="button" 
        tabindex="0" 
        @keydown.enter="handleClick"
        aria-label="View author details"
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
                @click.stop="$emit('edit', author)"
                aria-label="Edit author"
            >
                Edit
            </button>
            <button
                v-if="hasPermission('delete:author')"
                class="btn btn-delete" 
                @click.stop="handleDelete"
                aria-label="Delete author"
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
    z-index: 0;
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
}

.btn-edit {
    background-color: var(--primary-color);
    color: #fff;
    border-color: var(--primary-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.btn-edit::before {
    content: '\270E'; /* Pencil icon */
    font-size: 1rem;
}

.btn-edit:hover {
    background-color: var(--primary-color-dark);
    border-color: var(--primary-color-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-delete {
    background-color: var(--danger-color);
    color: #fff;
    border-color: var(--danger-color);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
}

.btn-delete::before {
    content: '\1F5D1'; /* Trash bin icon */
    font-size: 1rem;
}

.btn-delete:hover {
    background-color: var(--danger-color-dark);
    border-color: var(--danger-color-dark);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.btn-delete {
    background-color: #FF6B6B;
    color: white;
    border: 1px solid #FF4D4D;
    transition: background-color 0.3s ease, border-color 0.3s ease;
}

.btn-delete:hover {
    background-color: #FF4D4D;
    border-color: #FF2D2D;
    box-shadow: 0 2px 8px rgba(255, 77, 77, 0.5);
}

</style>
