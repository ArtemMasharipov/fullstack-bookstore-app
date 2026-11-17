<template>
    <div>
        <div v-if="loading" class="text-center py-8">
            <loading-spinner />
        </div>

        <!-- A failed load says why, by its error code, and offers to try again -->
        <error-message
            v-else-if="error"
            :error="error"
            :on-retry="load"
            :closable="false"
            class="mx-auto my-6"
            style="max-width: 800px"
        />

        <v-container v-else-if="author">
            <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4"></v-breadcrumbs>

            <v-card class="mb-6">
                <v-card-item>
                    <template v-slot:prepend>
                        <v-avatar color="primary" size="64">
                            <span class="text-h4 font-weight-bold text-white">{{ authorInitials }}</span>
                        </v-avatar>
                    </template>
                    <v-card-title class="text-h4 font-weight-bold">{{ authorName }}</v-card-title>
                    <v-card-subtitle v-if="author.booksCount">
                        {{ t('authors.bookCount', { count: author.booksCount }) }}
                    </v-card-subtitle>
                </v-card-item>
                <v-card-text v-if="author.bio" class="text-body-1">
                    {{ author.bio }}
                </v-card-text>
            </v-card>

            <template v-if="author.books?.length">
                <h2 class="text-h5 font-weight-bold mb-4">{{ t('authors.booksBy', { name: authorName }) }}</h2>

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
                        <book-card :book="book" class="w-100" />
                    </v-col>
                </v-row>
            </template>
            <v-alert v-else type="info" variant="tonal" class="mt-4" icon="mdi-bookshelf">
                {{ t('authors.noBooks') }}
            </v-alert>
        </v-container>
    </div>
</template>

<script setup>
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import BookCard from '@/components/features/books/BookCard.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useAuthorsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, watch } from 'vue'

const props = defineProps({
    authorId: {
        type: String,
        required: true,
    },
})

const authorsStore = useAuthorsStore()
const { current: currentAuthor, currentLoading: loading, currentError: error } = storeToRefs(authorsStore)

const author = computed(() => currentAuthor.value)
const authorName = computed(() => (author.value ? `${author.value.firstName} ${author.value.lastName}` : ''))
const authorInitials = computed(() => {
    return authorName.value
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
})

const breadcrumbItems = computed(() => [
    { title: t('routes.Authors'), to: localeRoute('Authors') },
    // Shown only with a loaded author, so the name is never empty
    { title: authorName.value, disabled: true },
])

const load = async () => {
    try {
        await authorsStore.fetchAuthorById(props.authorId)
    } catch {
        // The store keeps the error of the newest request, and the page shows it with Retry
    }
}

// The router keeps this page when only the id changes (one author to another): the new id loads the new author
watch(() => props.authorId, load, { immediate: true })
</script>
