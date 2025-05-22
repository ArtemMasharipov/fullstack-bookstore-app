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
            <!-- Admin actions removed in preparation for new admin panel -->
        </v-card-item>
    </v-card>
</template>

<script>
import { useAuthStore } from '@/store'

export default {
    name: 'AuthorListItem',

    props: {
        author: {
            type: Object,
            required: true,
        },
    },

    emits: ['click'],
    computed: {
        authStore() {
            return useAuthStore()
        },
    },
    methods: {
        handleClick() {
            this.$emit('click')
        },
    },
}
</script>
