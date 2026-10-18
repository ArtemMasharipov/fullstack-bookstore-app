<template>
    <v-app>
        <admin-layout v-if="route.meta.layout === 'admin'" />

        <template v-else>
            <nav-bar-layout />

            <v-main>
                <v-container fluid>
                    <router-view />
                </v-container>
            </v-main>

            <footer-layout />
        </template>

        <!-- Dialog system (separate from notifications for SOLID principles) -->
        <dialog-layout />

        <!-- Global notifications system -->
        <notification-container />
    </v-app>
</template>

<script setup>
// Components
import { DialogLayout, FooterLayout, NavBarLayout } from './components/layout'
import NotificationContainer from './components/notifications/NotificationContainer.vue'

// Stores
import { useAuthStore, useCartStore } from './stores'

// Composition API imports
import { defineAsyncComponent, onMounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useLocale } from 'vuetify'
import { locale } from '@/i18n'

// The admin layout, and the admin code with it, loads only when an admin page opens
const AdminLayout = defineAsyncComponent(() => import('./components/layout/admin/AdminLayout.vue'))

const route = useRoute()

// Store instances
const authStore = useAuthStore()
const cartStore = useCartStore()

// Vuetify's own texts follow the page language
const vuetifyLocale = useLocale()
watchEffect(() => {
    vuetifyLocale.current.value = locale.value
})

// Lifecycle hooks
onMounted(async () => {
    // Initialize auth store to restore user data from localStorage and validate token
    await authStore.initialize()
    // The cart badge needs the cart on every page, not only on the cart page
    await cartStore.load()
})
</script>

<style>
@import './assets/styles/common-variables.css';
html,
body {
    margin: 0;
    padding: 0;
    height: 100%;
}

.v-application {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
