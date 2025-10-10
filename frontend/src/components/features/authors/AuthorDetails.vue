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
                    <!-- Admin action removed in preparation for new admin panel -->
                </v-card-item>
            </v-card>

            <template v-if="author.books.length">
                <h2 class="text-h5 mb-4">Books by {{ author.name }}</h2>

                <v-row>
                    <v-col v-for="book in author.books" :key="book.id" cols="12" sm="6" md="4" lg="3">
                        <book-card :book="book" @click="$router.push(`/books/${book.id}`)" />
                    </v-col>
                </v-row>
            </template>
            <v-alert v-else type="info" variant="tonal" class="mt-4"> No books found for this author. </v-alert>
        </v-container>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mx-auto my-6" max-width="800">
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

<script setup>
import BookCard from '@/components/features/books/BookCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthorsStore, useAuthStore } from '@/store'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Props definition
 */
const props = defineProps({
    authorId: {
        type: String,
        required: true,
    },
})

/**
 * Events emitted by this component
 */
const emit = defineEmits(['edit', 'delete'])

/**
 * Composables
 */
const router = useRouter()

/**
 * Store instances
 */
const authorsStore = useAuthorsStore()
const authStore = useAuthStore()

/**
 * Reactive data
 */
const showDeleteModalPage = ref(false)

/**
 * Computed properties
 */
const currentAuthor = computed(() => authorsStore.currentAuthor)
const loading = computed(() => authorsStore.loading)
const error = computed(() => authorsStore.error)
const author = computed(() => currentAuthor.value)

const breadcrumbItems = computed(() => [
    {
        title: 'Authors',
        to: '/authors',
    },
    {
        title: author.value?.name || 'Unknown Author',
        disabled: true,
    },
])

/**
 * Methods
 */
const fetchAuthor = (id) => {
    return authorsStore.fetchAuthor(id)
}

const deleteAuthor = (id) => {
    return authorsStore.deleteAuthor(id)
}

const handleEdit = () => {
    emit('edit', author.value)
}

const confirmDelete = () => {
    showDeleteModalPage.value = true
}

const handleDelete = async () => {
    try {
        await deleteAuthor(author.value.id)
        router.push('/authors')
    } catch (error) {
        console.error('Failed to delete author:', error.message || error)
    }
}

/**
 * Lifecycle hooks
 */
onMounted(() => {
    fetchAuthor(props.authorId)
})
</script>
