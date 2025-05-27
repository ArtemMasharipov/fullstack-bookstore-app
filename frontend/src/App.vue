<template>
    <v-app>
        <nav-bar-layout />

        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>

        <footer-layout />

        <!-- Dialog system (separate from notifications for SOLID principles) -->
        <dialog-layout />
    </v-app>
</template>

<script setup>
// Components
import { DialogLayout, FooterLayout, NavBarLayout } from './components/layout'

// Stores
import { useAuthStore } from './store'

// Composition API imports
import { onMounted } from 'vue'

// Store instance
const authStore = useAuthStore()

// Lifecycle hooks
onMounted(() => {
    // Initialize auth store to restore user data from localStorage and validate token
    authStore.initialize()
})
</script>

<style>
/* Импортируем общие стили, но только те, которые не конфликтуют с Vuetify */
@import './assets/styles/common-variables.css';

/* Базовые стили для интеграции с Vuetify */
html,
body {
    margin: 0;
    padding: 0;
    height: 100%;
}

.v-application {
    font-family: 'Roboto', sans-serif;
}
</style>
