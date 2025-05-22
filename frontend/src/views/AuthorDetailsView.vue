<template>
    <v-container>
        <author-details :author-id="$route.params.id" />
    </v-container>
</template>

<script>
import AuthorDetails from '@/components/features/authors/AuthorDetails.vue'

export default {
    name: 'AuthorDetailsView',
    components: {
        AuthorDetails,
    },
}
</script>
