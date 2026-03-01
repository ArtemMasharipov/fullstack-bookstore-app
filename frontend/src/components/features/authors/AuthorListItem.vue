<template>
    <v-card variant="outlined" class="mb-3 author-card" hover @click="handleClick" @keydown.enter="handleClick">
        <v-card-item>
            <template v-slot:prepend>
                <v-avatar color="primary" size="48">
                    <span class="text-h6 font-weight-bold text-white">{{ initials }}</span>
                </v-avatar>
            </template>
            <v-card-title class="text-h6">{{ author.name }}</v-card-title>
            <v-card-subtitle v-if="author.books?.length">
                {{ author.books.length }} {{ author.books.length === 1 ? 'book' : 'books' }}
            </v-card-subtitle>
        </v-card-item>
        <v-card-text v-if="author.biography" class="pt-0">
            <p class="text-body-2 text-medium-emphasis text-truncate-3">{{ author.biography }}</p>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    author: {
        type: Object,
        required: true,
    },
})

const emit = defineEmits(['click'])

const initials = computed(() => {
    return (props.author.name || '')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
})

const handleClick = () => {
    emit('click')
}
</script>

<style scoped>
.author-card {
    transition: transform 200ms ease, box-shadow 200ms ease;
    cursor: pointer;
}

.author-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 2px 8px rgba(27, 42, 74, 0.08)) !important;
}

.text-truncate-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
