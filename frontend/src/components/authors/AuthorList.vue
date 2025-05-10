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
            v-model="showForm"
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
            <error-message :message="error" @close="clearError" />
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
import { useAuthorsStore, useAuthorsUiStore } from '@/stores'
import { mapActions, mapGetters } from 'pinia'
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
      computed: {
        ...mapGetters(useAuthorsStore, {
            authors: 'authorsList',
            loading: 'authorsLoading',
            error: 'authorsError'
        }),
        ...mapGetters(useAuthorsUiStore, [
            'getShowForm',
            'getSelectedAuthor',
            'getShowDeleteConfirm',
            'getAuthorToDelete'
        ]),
        
        // Aliases for better readability
        showForm() {
            return this.getShowForm;
        },
        selectedAuthor() {
            return this.getSelectedAuthor;
        },
        showDeleteConfirm() {
            return this.getShowDeleteConfirm;
        },
        authorToDelete() {
            return this.getAuthorToDelete;
        }
    },
    
    created() {
        this.fetchAuthors();
    },
    
    methods: {
        ...mapActions(useAuthorsUiStore, [
            'fetchAuthors',
            'openCreateForm',
            'openEditForm',
            'closeForm',
            'handleFormSubmit',
            'handleDelete',
            'confirmDelete',
            'cancelDelete'
        ]),        handleAuthorClick(authorId) {
            this.$emit('author-click', authorId);
        },
          clearError() {
            const authorsStore = useAuthorsStore();
            authorsStore.clearError();
        },
    },
}
</script>