<template>
    <div class="author-list-container">
        <div class="author-list-header">
            <h2 class="author-list-title">Authors</h2>
            <button class="create-button" @click="openCreateForm">
                <span class="button-icon">+</span>
                Create New Author
            </button>
        </div>

        <author-form
            v-if="showForm"
            :initial-data="selectedAuthor"
            :loading="loading"
            class="author-form"
            @submit="handleFormSubmit"
            @close="closeForm"
        />

        <div v-if="loading" class="loading-container">
            <loading-spinner />
        </div>

        <div v-else class="authors-list">
            <author-list-item
                v-for="author in authors"
                :key="author.id"
                :author="author"
                class="author-item"
                @edit="openEditForm(author)"
                @delete="deleteAuthor(author.id)"
                @click="handleAuthorClick(author.id)"
            />
        </div>

        <error-message 
            v-if="error" 
            :message="error" 
            class="error-message"
        />
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AuthorListItem from './AuthorListItem.vue'
import AuthorForm from './AuthorForm.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'

export default {
    name: 'AuthorList',
    
    components: {
        AuthorListItem,
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
        }
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
        ...mapActions('authors', [
            'fetchAuthors',
            'createAuthor',
            'updateAuthor',
            'deleteAuthor'
        ]),
        
        openCreateForm() {
            this.selectedAuthor = {}
            this.showForm = true
        },
        
        openEditForm(author) {
            // Explicitly include id in the spread
            this.selectedAuthor = { 
                id: author.id || author._id, 
                ...author 
            }
            this.showForm = true
        },
        
        closeForm() {
            this.showForm = false
            this.selectedAuthor = null
        },
        
        async handleFormSubmit(formData) {
            this.loading = true
            this.error = null
            
            try {
                if (formData.id) {
                    await this.updateAuthor(formData)
                } else {
                    await this.createAuthor(formData)
                }
                this.closeForm()
                await this.fetchAuthors()
            } catch (error) {
                this.error = error.message
            } finally {
                this.loading = false
            }
        },
        
        handleAuthorClick(authorId) {
            this.$emit('author-click', authorId)
        },
    },
}
</script>

<style scoped>
.author-list-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    background: var(--white, #ffffff);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.author-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color, #eaeaea);
}

.author-list-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #2c3e50);
    margin: 0;
}

.create-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: var(--primary-color, #4CAF50);
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.create-button:hover {
    background-color: var(--primary-dark, #388E3C);
}

.button-icon {
    font-size: 1.2rem;
    font-weight: bold;
}

.authors-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.author-item {
    background: var(--background-light, #f8f9fa);
    border: 1px solid var(--border-color, #eaeaea);
    border-radius: 4px;
    transition: all 0.2s ease;
}

.author-item:hover {
    transform: translateX(4px);
    border-color: var(--primary-color, #4CAF50);
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.author-form {
    margin-bottom: 1.5rem;
}

.error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
    background-color: var(--error-light, #ffebee);
    color: var(--error, #d32f2f);
}

@media (max-width: 768px) {
    .author-list-container {
        padding: 1rem;
    }

    .author-list-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
    
    .create-button {
        width: 100%;
        justify-content: center;
    }
}
</style>