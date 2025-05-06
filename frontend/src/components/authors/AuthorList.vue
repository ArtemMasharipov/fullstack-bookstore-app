<template>
    <v-card class="mx-auto">
        <v-card-item>
            <v-row align="center" no-gutters>
                <v-col cols="12" sm="6">
                    <v-card-title class="text-h5 pa-0">Authors</v-card-title>
                </v-col>
                
                <v-col cols="12" sm="6" class="d-flex justify-end">
                    <v-btn 
                        color="primary"
                        prepend-icon="mdi-plus"
                        @click="openCreateForm"
                    >
                        Create New Author
                    </v-btn>
                </v-col>
            </v-row>
        </v-card-item>
                
        <v-divider class="mb-3"></v-divider>
        
        <author-form
            v-if="showForm"
            :initial-data="selectedAuthor"
            :loading="loading"
            @submit="handleFormSubmit"
            @close="closeForm"
        />
        
        <div v-if="loading" class="py-8">
            <loading-spinner />
        </div>
        
        <v-card-text v-else-if="authors.length === 0" class="text-center py-8 text-medium-emphasis">
            No authors found.
        </v-card-text>
        
        <v-card-text v-else class="pa-2">
            <author-list-item
                v-for="author in authors"
                :key="author._id"
                :author="author"
                @edit="openEditForm(author)"
                @delete="handleDelete"
                @click="handleAuthorClick(author._id)"
            />
        </v-card-text>
        
        <v-card-text v-if="error" class="px-0">
            <error-message :message="error" @close="error = null" />
        </v-card-text>
        
        <base-modal v-model="showDeleteConfirm" size="small">
            <confirm-modal
                title="Delete Author"
                message="Are you sure you want to delete this author? This action cannot be undone."
                confirm-text="Delete"
                cancel-text="Cancel"
                @confirm="confirmDelete"
                @cancel="cancelDelete"
            />
        </base-modal>
    </v-card>
</template>

<script>
import { useAuthorsStore } from '@/stores'
import BaseModal from '../common/BaseModal.vue'
import ConfirmModal from '../common/ConfirmModal.vue'
import ErrorMessage from '../common/ErrorMessage.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import AuthorForm from './AuthorForm.vue'
import AuthorListItem from './AuthorListItem.vue'

export default {
    name: 'AuthorList',
    
    components: {
        AuthorListItem,
        AuthorForm,
        LoadingSpinner,
        ErrorMessage,
        ConfirmModal,
        BaseModal,
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
        authorsStore() {
            return useAuthorsStore();
        },
        authors() {
            return this.authorsStore.authorsList || [];
        }
    },
    
    created() {
        this.fetchAuthors();
    },
    
    methods: {
        async fetchAuthors() {
            await this.authorsStore.fetchAuthors();
        },
        
        async handleAction(action, ...args) {
            this.error = null;
            this.loading = true;
            try {
                await action(...args);
                await this.fetchAuthors();
                this.closeForm();
            } catch (error) {
                this.error = error.message;
                console.error(`Action failed:`, error);
            } finally {
                this.loading = false;
            }
        },
        
        openCreateForm() {
            this.selectedAuthor = { _id: null, name: '', biography: '' };
            this.showForm = true;
        },
        
        openEditForm(author) {
            this.selectedAuthor = { ...author };
            this.showForm = true;
        },
        
        closeForm() {
            this.showForm = false;
            this.selectedAuthor = null;
            this.error = null;
        },
        
        handleFormSubmit(formData) {
            const action = formData._id 
                ? (data) => this.authorsStore.updateAuthor(data)
                : (data) => this.authorsStore.createAuthor(data);
            
            this.handleAction(action, formData);
        },
        
        handleDelete(authorId) {
            this.authorToDelete = authorId;
            this.showDeleteConfirm = true;
        },
        
        async confirmDelete() {
            await this.handleAction(
                (id) => this.authorsStore.deleteAuthor(id), 
                this.authorToDelete
            );
            this.showDeleteConfirm = false;
            this.authorToDelete = null;
        },
        
        cancelDelete() {
            this.showDeleteConfirm = false;
            this.authorToDelete = null;
        },

        handleAuthorClick(authorId) {
            this.$emit('author-click', authorId);
        },
    },
}
</script>