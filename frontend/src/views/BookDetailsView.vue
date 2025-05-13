<template>
    <v-container>
        <book-details :book-id="$route.params.id" />
    </v-container>
</template>

<script>
import BookDetails from '@/components/books/BookDetails.vue'

export default {
    name: 'BookDetailsView',
    components: {
        BookDetails,
    },
}
</script>
