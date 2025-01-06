<template>
    <div class="author-list-container" :class="{ 'modal-open': showForm }">
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
                :key="author._id"
                :author="author"
                class="author-item"
                @edit="openEditForm(author)"
                @delete="handleDelete"
                @click="handleAuthorClick(author._id)"
            />
        </div>

        <error-message 
            v-if="error" 
            :message="error" 
            class="error-message"
        />

        <confirm-modal
            v-if="showDeleteConfirm"
            title="Delete Author"
            message="Are you sure you want to delete this author? This action cannot be undone."
            confirm-text="Delete"
            cancel-text="Cancel"
            @confirm="confirmDelete"
            @cancel="cancelDelete"
        />
    </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AuthorListItem from './AuthorListItem.vue'
import AuthorForm from './AuthorForm.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import ErrorMessage from '../common/ErrorMessage.vue'
import ConfirmModal from '../common/ConfirmModal.vue'

export default {
    name: 'AuthorList',
    
    components: {
        AuthorListItem,
        AuthorForm,
        LoadingSpinner,
        ErrorMessage,
        ConfirmModal,
    },
    
    emits: ['author-click'],
    
    data() {
        return {
            showForm: false,
            selectedAuthor: null,
            loading: false,
            error: null,
            showDeleteConfirm: false,
            authorToDelete: null,
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
        ...mapActions('authors', ['fetchAuthors', 'createAuthor', 'updateAuthor', 'deleteAuthor']),
        
        async handleAction(action, ...args) {
            this.error = null
            this.loading = true
            try {
                await action(...args)
                await this.fetchAuthors()
                this.closeForm()
            } catch (error) {
                this.error = error.message
                console.error(`Action failed:`, error)
            } finally {
                this.loading = false
            }
        },
        
        openCreateForm() {
            this.selectedAuthor = { _id: null, name: '', biography: '' }
            this.showForm = true
        },
        
        openEditForm(author) {
            this.selectedAuthor = { ...author }
            this.showForm = true
        },
        
        closeForm() {
            this.showForm = false
            this.selectedAuthor = null
            this.error = null
        },
        
        handleFormSubmit(formData) {
            const action = formData._id ? this.updateAuthor : this.createAuthor
            this.handleAction(action, formData)
        },
        
        handleDelete(authorId) {
            this.authorToDelete = authorId;
            this.showDeleteConfirm = true;
        },
        
        async confirmDelete() {
            await this.handleAction(this.deleteAuthor, this.authorToDelete);
            this.showDeleteConfirm = false;
            this.authorToDelete = null;
        },
        
        cancelDelete() {
            this.showDeleteConfirm = false;
            this.authorToDelete = null;
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
    position: relative;
    z-index: 1;
}

.author-list-container.modal-open::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
}

/* Стили для заголовка списка авторов */
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
    background-color: var(--primary-dark, #155819);
}

.button-icon {
    font-size: 1.2rem;
    font-weight: bold;
}

/* Список авторов */
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
    z-index: 0;
}

.author-item:hover {
    border-color: var(--primary-color, #4CAF50);
}

.loading-container {
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.author-form {
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 2;
    background: var(--white, #ffffff);
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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