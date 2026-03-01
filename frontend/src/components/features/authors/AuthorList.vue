<template>
    <v-card flat>
        <v-toolbar color="primary" flat rounded="0" elevation="1">
            <v-toolbar-title class="text-white font-weight-medium"> Authors </v-toolbar-title>
            <v-spacer />
            <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                label="Search authors"
                hide-details
                density="compact"
                variant="solo-filled"
                class="mx-2 mt-1 shrink"
                bg-color="primary-lighten-1"
                style="max-width: 250px"
                clearable
            />
        </v-toolbar>

        <div v-if="loading" class="py-8">
            <loading-spinner />
        </div>

        <v-card-text v-else-if="filteredAuthors.length === 0" class="text-center py-8">
            <v-icon icon="mdi-account-search-outline" size="48" color="medium-emphasis" class="mb-3" />
            <p class="text-medium-emphasis">No authors found.</p>
        </v-card-text>

        <v-card-text v-else class="pa-4">
            <v-row>
                <v-col v-for="author in filteredAuthors" :key="author._id" cols="12" sm="6" md="4">
                    <author-list-item :author="author" @click="handleAuthorClick(author._id)" />
                </v-col>
            </v-row>
        </v-card-text>

        <v-card-text v-if="error" class="px-0">
            <error-message :message="error" @close="clearError" />
        </v-card-text>
    </v-card>
</template>

<script setup>
import { useAuthorsStore } from '@/stores'
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import ErrorMessage from '../../ui/ErrorMessage.vue'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import AuthorListItem from './AuthorListItem.vue'

const emit = defineEmits(['author-click'])
const authorsStore = useAuthorsStore()
const { list: authors, loading, error } = storeToRefs(authorsStore)

const searchQuery = ref('')

const filteredAuthors = computed(() => {
    if (!searchQuery.value) return authors.value
    const q = searchQuery.value.toLowerCase()
    return authors.value.filter((a) => a.name?.toLowerCase().includes(q))
})

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

onMounted(() => {
    fetchAuthors()
})
</script>
