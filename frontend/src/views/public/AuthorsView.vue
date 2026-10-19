<template>
    <v-container>
        <author-list @author-click="goToAuthor" />
    </v-container>
</template>

<script setup>
import AuthorList from '@/components/features/authors/AuthorList.vue'
import { useRouter } from 'vue-router'
import { localeRoute } from '@/router/locale'

const router = useRouter()
const goToAuthor = (id) => router.push(localeRoute('AuthorDetails', { params: { id } }))
</script>
