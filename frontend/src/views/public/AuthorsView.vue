<template>
    <v-container>
        <author-list @author-click="goToAuthor" />
    </v-container>
</template>

<script setup>
import AuthorList from '@/components/features/authors/AuthorList.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const goToAuthor = (authorId) => router.push(`/authors/${authorId}`)
</script>
