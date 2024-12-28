<template>
    <div class="author-list">
        <button @click="openCreateForm">Create New Author</button>
        
        <author-form
            v-if="showForm"
            :initial-data="selectedAuthor"
            :loading="loading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <div v-if="loading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else class="authors-grid">
            <author-card
                v-for="author in authors"
                :key="author.id"
                :author="author"
                @edit="openEditForm(author)"
                @delete="deleteAuthor(author.id)"
            />
        </div>

        <div v-if="error" class="error-container">
            <error-message :message="error" />
        </div>
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AuthorCard from './AuthorCard.vue'
import AuthorForm from './AuthorForm.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'

export default {
    name: 'AuthorList',

    components: {
        AuthorCard,
        AuthorForm,
        LoadingSpinner,
        ErrorMessage,
    },

    emits: ['author-click'],

    data() {
        return {
            showForm: false,
            selectedAuthor: null,
            loading: false,
            error: null,
        };
    },

    computed: {
        ...mapGetters('authors', ['authorsList', 'authorsLoading', 'authorsError']),
        authors() {
            return this.authorsList
        }
    },

    created() {
        this.fetchAuthors()
    },

    methods: {
        ...mapActions('authors', ['fetchAuthors', 'createAuthor', 'updateAuthor', 'deleteAuthor']),

        openCreateForm() {
            this.selectedAuthor = {};
            this.showForm = true;
        },

        openEditForm(author) {
            this.selectedAuthor = author;
            this.showForm = true;
        },

        closeForm() {
            this.showForm = false;
        },

        async handleFormSubmit(formData) {
            this.loading = true;
            try {
                if (formData.id) {
                    await this.updateAuthor(formData);
                } else {
                    await this.createAuthor(formData);
                }
                this.closeForm();
                this.fetchAuthors();
            } catch (error) {
                this.error = error.message;
            } finally {
                this.loading = false;
            }
        },

        handleAuthorClick(authorId) {
            this.$emit('author-click', authorId)
        },
    },
}
</script>

<style scoped>
.author-list {
    padding: 1rem;
}

.authors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.error-container {
    max-width: 600px;
    margin: 2rem auto;
}
</style>
