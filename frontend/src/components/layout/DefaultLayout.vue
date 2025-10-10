<template>
    <v-app>
        <nav-bar />

        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>

        <footer-layout />

        <!-- Global Dialog System removed - DialogUI component not found -->
    </v-app>
</template>

<script setup>
// Components
import FooterLayout from '@/components/layout/FooterLayout.vue'
import NavBar from '@/components/layout/NavBar.vue'
</script>
