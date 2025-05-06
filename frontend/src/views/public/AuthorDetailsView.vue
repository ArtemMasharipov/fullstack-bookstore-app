<template>
    <v-container>
        <author-details :author-id="route.params.id" />
    </v-container>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AuthorDetails from '@/components/features/authors/AuthorDetails.vue'

// AuthorDetailsView component - detailed author view page

// Router
const route = useRoute()
</script>
