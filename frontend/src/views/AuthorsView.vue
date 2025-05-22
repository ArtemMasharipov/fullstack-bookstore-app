<template>
    <v-container>
        <author-list />
    </v-container>
</template>

<script>
import AuthorList from '@/components/features/authors/AuthorList.vue'

export default {
    name: 'AuthorsView',
    components: {
        AuthorList,
    },
}
</script>
