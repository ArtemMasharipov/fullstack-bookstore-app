<template>
    <v-app-bar app color="primary" class="text-white">
        <v-container class="py-0 px-2">
            <v-row align="center" no-gutters>
                <!-- Logo/Brand -->
                <v-col cols="auto">
                    <router-link to="/" class="text-decoration-none text-white">
                        <v-btn variant="text" size="large" class="text-h6 font-weight-bold text-white">
                            📚 Bookstore
                        </v-btn>
                    </router-link>
                </v-col>

                <v-spacer></v-spacer>

                <!-- Navigation Links -->
                <v-col cols="auto">
                    <v-btn variant="text" to="/books" class="text-white">Books</v-btn>
                    <v-btn variant="text" to="/authors" class="text-white">Authors</v-btn>
                    <v-btn variant="text" to="/contact" class="text-white">Contact</v-btn>
                </v-col>

                <!-- Auth Section -->
                <v-col cols="auto">
                    <template v-if="isAuthenticated">
                        <!-- Cart Icon -->
                        <v-btn variant="text" to="/cart" icon class="text-white">
                            <v-badge :content="cartItemsCount" color="red" v-if="cartItemsCount > 0">
                                <v-icon>mdi-cart</v-icon>
                            </v-badge>
                            <v-icon v-else>mdi-cart</v-icon>
                        </v-btn>

                        <!-- User Menu -->
                        <v-menu>
                            <template v-slot:activator="{ props }">
                                <v-btn variant="text" v-bind="props" class="text-white">
                                    <v-icon left>mdi-account</v-icon>
                                    {{ user.name }}
                                    <v-icon right>mdi-chevron-down</v-icon>
                                </v-btn>
                            </template>
                            <v-list>
                                <v-list-item to="/profile">
                                    <v-list-item-title>Profile</v-list-item-title>
                                </v-list-item>
                                <v-list-item to="/orders">
                                    <v-list-item-title>My Orders</v-list-item-title>
                                </v-list-item>
                                <v-list-item v-if="isAdmin" to="/admin">
                                    <v-list-item-title>Admin Panel</v-list-item-title>
                                </v-list-item>
                                <v-divider></v-divider>
                                <v-list-item @click="logout">
                                    <v-list-item-title>Logout</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </template>

                    <template v-else>
                        <v-btn variant="text" to="/login" class="text-white">Login</v-btn>
                        <v-btn variant="outlined" to="/register" class="text-white">Register</v-btn>
                    </template>
                </v-col>
            </v-row>
        </v-container>
    </v-app-bar>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

/**
 * NavBar component - Application navigation bar
 */

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()
const cartStore = useCartStore()

// Reactive state
const { isAuthenticated, user } = storeToRefs(authStore)
const { items } = storeToRefs(cartStore)

// Computed properties
const isAdmin = computed(() => user.value?.role === 'admin')
const cartItemsCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

// Methods
const logout = async () => {
    await authStore.logout()
    router.push('/')
}
</script>

<style scoped>
/* Ensure white text remains visible on primary background */
.v-app-bar {
    color: white !important;
}

.v-app-bar .v-btn {
    color: white !important;
}

.v-app-bar .v-btn:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
}

.v-app-bar .v-icon {
    color: white !important;
}

/* Styles for outlined Register button */
.v-app-bar .v-btn--variant-outlined {
    border-color: white !important;
    color: white !important;
}

.v-app-bar .v-btn--variant-outlined:hover {
    background-color: white !important;
    color: var(--primary-color) !important;
}
</style>
