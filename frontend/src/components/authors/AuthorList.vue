<template>
    <v-card class="mx-auto">        <v-card-item>
            <v-row align="center" no-gutters>
                <v-col cols="12" sm="6">
                    <v-card-title class="text-h5 pa-0">Authors</v-card-title>
                </v-col>
                  <v-col v-if="authStore.hasPermission('admin:access')" cols="12" sm="6" class="d-flex justify-end">
                    <v-btn 
                        color="primary"
                        prepend-icon="mdi-shield-account"
                        :to="`/admin/authors`"
                    >
                        Manage Authors
                    </v-btn>
                </v-col>
            </v-row>
        </v-card-item>
                
        <v-divider class="mb-3"></v-divider><!-- Author form removed - now managed in admin panel -->
        
        <div v-if="loading" class="py-8">
            <loading-spinner />
        </div>
          <v-card-text v-else-if="authors.length === 0" class="text-center py-8 text-medium-emphasis">
            <p>No authors found.</p>            <v-btn 
                v-if="authStore.hasPermission('admin:access')"
                color="primary"
                variant="text"
                prepend-icon="mdi-account-plus"
                class="mt-4"
                :to="`/admin/authors`"
            >
                Add authors in the admin panel
            </v-btn>
        </v-card-text>
        
        <v-card-text v-else class="pa-2">            <author-list-item
                v-for="author in authors"
                :key="author._id"
                :author="author"
                @click="handleAuthorClick(author._id)"
            />
        </v-card-text>
          <v-card-text v-if="error" class="px-0">
            <error-message :message="error" @close="clearError" />
        </v-card-text>
  <!-- Delete confirmation moved to admin panel -->
    </v-card>
</template>

<script>
import { useAuthorsStore, useAuthorsUiStore, useAuthStore } from '@/stores'
import { mapActions, mapGetters } from 'pinia'
import ErrorMessage from '../common/ErrorMessage.vue'
import LoadingSpinner from '../common/LoadingSpinner.vue'
import AuthorListItem from './AuthorListItem.vue'

export default {
    name: 'AuthorList',
      components: {
        AuthorListItem,
        LoadingSpinner,
        ErrorMessage,
    },
    
    emits: ['author-click'],
      computed: {
        ...mapGetters(useAuthorsStore, {
            authors: 'authorsList',
            loading: 'authorsLoading',
            error: 'authorsError'
        }),        
        authStore() {
            return useAuthStore();
        }
        // CRUD related getters removed - now managed in admin panel
    },
    
    created() {
        this.fetchAuthors();
    },    methods: {
        ...mapActions(useAuthorsUiStore, [
            'fetchAuthors'
        ]),
  
        
        handleAuthorClick(authorId) {
            this.$emit('author-click', authorId);
        },
        
        clearError() {
            const authorsStore = useAuthorsStore();
            authorsStore.clearError();
        },
    },
}
</script>