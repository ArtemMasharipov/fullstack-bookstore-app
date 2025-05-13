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
              <template v-if="authStore.hasPermission('admin:access')">
                <v-card-actions class="justify-end">
                    <v-btn
                        variant="outlined"
                        color="secondary"
                        density="comfortable"
                        prepend-icon="mdi-shield-account"
                        aria-label="Manage author in admin"
                        @click.stop="$router.push('/admin/authors')"
                    >
                        Manage in Admin
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

    emits: ['click'],    computed: {
        authStore() {
            return useAuthStore();
        },
    },methods: {
        handleClick() {
            this.$emit('click');
        }
    },
};
</script>
