<template>
    <v-card class="mx-auto">
        <v-card-item>
            <v-row align="center" no-gutters>
                <v-col cols="12" sm="6">
                    <v-card-title class="text-h5 pa-0">Authors</v-card-title>
                </v-col>
                <!-- Admin button removed in preparation for new admin panel -->
            </v-row>
        </v-card-item>

        <v-divider class="mb-3"></v-divider
        ><!-- Author form removed - now managed in admin panel -->

        <div v-if="loading" class="py-8">
            <loading-spinner />
        </div>
        <v-card-text v-else-if="authors.length === 0" class="text-center py-8 text-medium-emphasis">
            <p>No authors found.</p>
            <!-- Admin link removed in preparation for new admin panel -->
        </v-card-text>

        <v-card-text v-else class="pa-2">
            <author-list-item
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

<script setup>
import { useAuthorsStore, useAuthStore } from '@/store'
import { computed, onMounted } from 'vue'
import ErrorMessage from '../../ui/ErrorMessage.vue'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import AuthorListItem from './AuthorListItem.vue'

/**
 * Events emitted by this component
 */
const emit = defineEmits(['author-click'])

/**
 * Store instances
 */
const authorsStore = useAuthorsStore()
const authStore = useAuthStore()

/**
 * Computed properties
 */
const authors = computed(() => authorsStore.authorsList)
const loading = computed(() => authorsStore.authorsLoading)
const error = computed(() => authorsStore.authorsError)

/**
 * Methods
 */
const fetchAuthors = async () => {
    try {
        await authorsStore.fetchAuthors()
    } catch (error) {
        // Failed to fetch authors
    }
}

const handleAuthorClick = (authorId) => {
    emit('author-click', authorId)
}

const clearError = () => {
    authorsStore.clearError()
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
    fetchAuthors()
})
</script>
