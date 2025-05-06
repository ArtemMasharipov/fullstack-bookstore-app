<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <loading-spinner />
        </div>

        <v-container v-else-if="author">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-card class="mb-6" variant="outlined">
                <v-card-item>
                    <v-card-title class="text-h4 mb-2">{{ author.name }}</v-card-title>
                    
                    <v-card-text class="text-body-1">
                        <p>{{ author.biography }}</p>
                    </v-card-text>
                    
                    <v-card-actions v-if="hasPermission('update:author') || hasPermission('delete:author')">
                        <v-spacer></v-spacer>
                        
                        <v-btn 
                            v-if="hasPermission('update:author')" 
                            color="primary" 
                            variant="outlined"
                            prepend-icon="mdi-pencil"
                            @click="handleEdit"
                        >
                            Edit
                        </v-btn>
                        
                        <v-btn 
                            v-if="hasPermission('delete:author')" 
                            color="error" 
                            variant="outlined"
                            prepend-icon="mdi-delete"
                            class="ml-2"
                            @click="confirmDelete"
                        >
                            Delete
                        </v-btn>
                    </v-card-actions>
                </v-card-item>
            </v-card>

            <template v-if="author.books.length">
                <h2 class="text-h5 mb-4">Books by {{ author.name }}</h2>
                
                <v-row>
                    <v-col 
                        v-for="book in author.books" 
                        :key="book.id" 
                        cols="12" sm="6" md="4" lg="3"
                    >
                        <book-card 
                            :book="book"
                            @click="$router.push(`/books/${book.id}`)"
                        />
                    </v-col>
                </v-row>
            </template>
            <v-alert
                v-else
                type="info"
                variant="tonal"
                class="mt-4"
            >
                No books found for this author.
            </v-alert>
        </v-container>

        <v-alert
            v-else-if="error"
            type="error"
            variant="tonal"
            class="mx-auto my-6"
            max-width="800"
        >
            {{ error }}
        </v-alert>

        <v-dialog v-model="showDeleteModalPage" max-width="400">
            <v-card>
                <v-card-title class="text-h5">Delete Author</v-card-title>
                <v-card-text>
                    <p>Are you sure you want to delete this author?</p>
                    <p class="text-caption mt-2">This will also remove all books associated with this author.</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="grey" variant="text" @click="showDeleteModalPage = false">Cancel</v-btn>
                    <v-btn color="error" @click="handleDelete">Delete</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
import BookCard from '@/components/books/BookCard.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useAuthorsStore, useAuthStore } from '@/stores'

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
        authorsStore() {
            return useAuthorsStore()
        },
        authStore() {
            return useAuthStore()
        },
        currentAuthor() {
            return this.authorsStore.currentAuthor
        },
        loading() {
            return this.authorsStore.loading
        },
        error() {
            return this.authorsStore.error
        },
        hasPermission() {
            return this.authStore.hasPermission
        },
        author() {
            return this.currentAuthor
        },
        breadcrumbItems() {
            return [
                {
                    title: 'Authors',
                    to: '/authors',
                },
                {
                    title: this.author?.name || 'Unknown Author',
                    disabled: true,
                },
            ];
        },
    },

    created() {
        this.fetchAuthor(this.authorId)
    },

    methods: {
        fetchAuthor(id) {
            return this.authorsStore.fetchAuthor(id)
        },
        deleteAuthor(id) {
            return this.authorsStore.deleteAuthor(id)
        },

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
