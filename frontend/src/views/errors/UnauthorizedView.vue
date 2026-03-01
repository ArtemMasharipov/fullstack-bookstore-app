<template>
    <v-container class="fill-height">
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" class="text-center">
                <v-icon icon="mdi-shield-lock-outline" size="80" color="error" class="mb-4" />
                <h1 class="text-h2 font-weight-bold mb-2">403</h1>
                <h2 class="text-h5 text-medium-emphasis mb-4">Access Denied</h2>
                <p class="text-body-1 text-medium-emphasis mb-8">
                    You don't have permission to view this page. Please sign in or contact support.
                </p>
                <div class="d-flex justify-center ga-3">
                    <v-btn color="primary" :to="{ name: 'Home' }" prepend-icon="mdi-home-outline"> Go Home </v-btn>
                    <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack"> Go Back </v-btn>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
const goBack = () => router.go(-1)
</script>
