<template>
    <div class="author-details-page">
        <loading-spinner v-if="loading" />

        <template v-else-if="author">
            <div class="breadcrumb"><router-link to="/authors">Authors</router-link> / {{ author.name }}</div>

            <div class="author-details">
                <div class="author-info">
                    <h1>{{ author.name }}</h1>
                    <p>{{ author.biography }}</p>
                </div>

                <div v-if="hasPermission('update:author') || hasPermission('delete:author')" class="action-buttons">
                    <button v-if="hasPermission('update:author')" class="btn btn-primary" @click="handleEdit">
                        Edit
                    </button>
                    <button v-if="hasPermission('delete:author')" class="btn btn-danger" @click="confirmDelete">
                        Delete
                    </button>
                </div>
            </div>

            <div v-if="author.books.length" class="author-books">
                <h2>Books by {{ author.name }}</h2>
                <div class="books-grid">
                    <book-card
                        v-for="book in author.books"
                        :key="book.id"
                        :book="book"
                        @click="$router.push(`/books/${book.id}`)"
                    />
                </div>
            </div>
        </template>

        <error-message v-else-if="error" :message="error" />

        <modal v-if="showDeleteModalPage" @close="showDeleteModalPage = false" @confirm="handleDelete">
            <p>Are you sure you want to delete this author?</p>
        </modal>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import BookCard from '@/components/books/BookCard.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'

export default {
    name: 'AuthorDetails',

    components: {
        BookCard,
        LoadingSpinner,
        ErrorMessage,
    },

    props: {
        authorId: {
            type: String,
            required: true,
        },
    },

    emits: ['edit', 'delete'],

    data() {
        return {
            showDeleteModalPage: false,
        }
    },

    computed: {
        ...mapGetters('authors', ['currentAuthor', 'loading', 'error']),
        ...mapGetters('auth', ['hasPermission']),
        author() {
            return this.currentAuthor
        },
    },

    created() {
        this.fetchAuthor(this.authorId)
    },

    methods: {
        ...mapActions('authors', ['fetchAuthor', 'deleteAuthor']),

        handleEdit() {
            this.$emit('edit', this.author)
        },

        confirmDelete() {
            this.showDeleteModalPage = true
        },

        async handleDelete() {
            try {
                await this.deleteAuthor(this.author.id)
                this.$router.push('/authors')
            } catch (error) {
                console.error('Failed to delete author:', error)
            }
        },
    },
}
</script>

<style scoped>
.author-details-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.breadcrumb {
    margin-bottom: 2rem;

    a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}

.author-details {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 3rem;
}

.author-info {
    h1 {
        margin: 0 0 1rem;
        color: var(--secondary-color);
    }
}

.action-buttons {
    margin-top: 2rem;
    display: flex;
    gap: 1rem;
}

.author-books {
    margin-top: 3rem;

    h2 {
        margin-bottom: 1.5rem;
        color: var(--secondary-color);
    }
}

.books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 2rem;
}
</style>
