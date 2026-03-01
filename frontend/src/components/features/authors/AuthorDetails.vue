<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <loading-spinner />
        </div>

        <v-container v-else-if="author">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-card class="mb-6">
                <v-card-item>
                    <template v-slot:prepend>
                        <v-avatar color="primary" size="64">
                            <span class="text-h4 font-weight-bold text-white">{{ authorInitials }}</span>
                        </v-avatar>
                    </template>
                    <v-card-title class="text-h4 font-weight-bold">{{ author.name }}</v-card-title>
                    <v-card-subtitle v-if="author.books?.length">
                        {{ author.books.length }} {{ author.books.length === 1 ? 'book' : 'books' }} published
                    </v-card-subtitle>
                </v-card-item>
                <v-card-text v-if="author.biography" class="text-body-1">
                    {{ author.biography }}
                </v-card-text>
            </v-card>

            <template v-if="author.books?.length">
                <h2 class="text-h5 font-weight-bold mb-4">Books by {{ author.name }}</h2>

                <v-row>
                    <v-col
                        v-for="book in author.books"
                        :key="book.id"
                        cols="12"
                        sm="6"
                        md="4"
                        lg="3"
                        class="d-flex align-stretch"
                    >
                        <book-card :book="book" class="w-100" @click="$router.push(`/books/${book.id}`)" />
                    </v-col>
                </v-row>
            </template>
            <v-alert v-else type="info" variant="tonal" class="mt-4" icon="mdi-bookshelf">
                No books found for this author yet.
            </v-alert>
        </v-container>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mx-auto my-6" max-width="800">
            {{ error }}
        </v-alert>
    </div>
</template>

<script setup>
import BookCard from '@/components/features/books/BookCard.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthorsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'

const props = defineProps({
    authorId: {
        type: String,
        required: true,
    },
})

const authorsStore = useAuthorsStore()
const { current: currentAuthor, loading, error } = storeToRefs(authorsStore)

const author = computed(() => currentAuthor.value)
const authorInitials = computed(() => {
    return (author.value?.name || '')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
})

const breadcrumbItems = computed(() => [
    { title: 'Authors', to: '/authors' },
    { title: author.value?.name || 'Unknown Author', disabled: true },
])

onMounted(() => {
    authorsStore.fetchAuthorById(props.authorId)
})
</script>
