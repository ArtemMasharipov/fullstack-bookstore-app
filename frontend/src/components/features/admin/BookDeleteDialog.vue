<template>
    <v-dialog v-model="localVisible" max-width="500" persistent>
        <v-card>
            <v-card-title class="text-h6 d-flex align-center">
                <v-icon color="error" class="me-3">mdi-alert-circle</v-icon>
                Confirm Delete
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text class="py-6">
                <div v-if="book">
                    <p class="mb-4">Are you sure you want to delete this book? This action cannot be undone.</p>

                    <v-card variant="outlined" class="pa-4">
                        <div class="d-flex align-center">
                            <v-avatar v-if="book.coverImage" size="60" class="me-4">
                                <v-img :src="book.coverImage" alt="Book cover"></v-img>
                            </v-avatar>
                            <v-icon v-else size="60" color="grey-lighten-1" class="me-4"> mdi-book </v-icon>

                            <div class="flex-grow-1">
                                <div class="text-h6">{{ book.title }}</div>
                                <div class="text-subtitle-2 text-medium-emphasis">
                                    by {{ book.author?.name || 'Unknown Author' }}
                                </div>
                                <div class="text-caption text-medium-emphasis">ISBN: {{ book.isbn }}</div>
                                <div class="text-caption">
                                    <v-chip size="small" variant="flat" :color="getStockColor(book.stock)" class="me-2">
                                        {{ book.stock }} in stock
                                    </v-chip>
                                    <span class="text-primary font-weight-medium"> ${{ book.price?.toFixed(2) }} </span>
                                </div>
                            </div>
                        </div>
                    </v-card>

                    <v-alert v-if="book.stock > 0" type="warning" variant="text" class="mt-4" density="compact">
                        <v-icon slot="prepend">mdi-information</v-icon>
                        This book currently has {{ book.stock }} {{ book.stock === 1 ? 'copy' : 'copies' }} in stock.
                    </v-alert>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="closeDialog" :disabled="loading"> Cancel </v-btn>
                <v-btn color="error" variant="flat" @click="confirmDelete" :loading="loading"> Delete Book </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
    visible: {
        type: Boolean,
        default: false,
    },
    book: {
        type: Object,
        default: null,
    },
    loading: {
        type: Boolean,
        default: false,
    },
})

// Emits
const emit = defineEmits(['update:visible', 'confirm'])

// Computed
const localVisible = computed({
    get() {
        return props.visible
    },
    set(value) {
        emit('update:visible', value)
    },
})

// Methods
const getStockColor = (stock) => {
    if (stock <= 0) return 'error'
    if (stock <= 5) return 'warning'
    return 'success'
}

const confirmDelete = () => {
    emit('confirm', props.book)
}

const closeDialog = () => {
    localVisible.value = false
}
</script>
