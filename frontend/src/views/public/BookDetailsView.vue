<template>
    <v-container>
        <book-details :book-id="route.params.id" />
    </v-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
// Components
import BookDetails from '@/components/features/books/BookDetails.vue'

// BookDetailsView component - detailed book view page

// Router
const route = useRoute()
</script>
