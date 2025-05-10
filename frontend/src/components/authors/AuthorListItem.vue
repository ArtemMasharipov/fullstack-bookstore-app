<template>
    <v-card
        variant="outlined"
        class="mb-3"
        role="button"
        tabindex="0"
        aria-label="View author details"
        @click="handleClick"
        @keydown.enter="handleClick"
    >
        <v-card-item>
            <div>
                <v-card-title class="text-h6">{{ author.name }}</v-card-title>
                <v-card-text class="py-2">
                    <p class="text-body-2 text-medium-emphasis">{{ author.biography }}</p>
                    <div class="text-caption mt-2">Books: {{ author.books?.length || 0 }}</div>
                </v-card-text>
            </div>
            
            <template v-if="authStore.hasPermission('update:author') || authStore.hasPermission('delete:author')">
                <v-card-actions class="justify-end">
                    <v-btn
                        v-if="authStore.hasPermission('update:author')"
                        variant="outlined"
                        color="primary"
                        density="comfortable"
                        prepend-icon="mdi-pencil"
                        aria-label="Edit author"
                        @click.stop="$emit('edit', author)"
                    >
                        Edit
                    </v-btn>
                    
                    <v-btn
                        v-if="authStore.hasPermission('delete:author')"
                        variant="outlined"
                        color="error"
                        class="ml-2"
                        density="comfortable"
                        prepend-icon="mdi-delete"
                        aria-label="Delete author"
                        @click.stop="handleDelete"
                    >
                        Delete
                    </v-btn>
                </v-card-actions>
            </template>
        </v-card-item>
    </v-card>
</template>

<script>
import { useAuthStore } from '@/stores';
import { mapGetters } from 'pinia';

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
        ...mapGetters(useAuthStore, ['hasPermission']),
        
        // For convenient template access, maintaining the previous naming convention
        authStore() {
            return {
                hasPermission: this.hasPermission
            };
        },
    },

    methods: {
        handleClick() {
            this.$emit('click');
        },        handleDelete() {
            const authorId = this.author._id;
            if (!authorId) {
                return;
            }
            this.$emit('delete', authorId);
        },
    },
};
</script>
