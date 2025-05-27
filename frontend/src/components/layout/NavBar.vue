<template>
    <v-app-bar app color="primary" dark>
        <v-container class="py-0 px-2">
            <v-row align="center" no-gutters>
                <!-- Logo/Brand -->
                <v-col cols="auto">
                    <router-link to="/" class="text-decoration-none text-white">
                        <v-btn variant="text" size="large" class="text-h6 font-weight-bold">
                            📚 Bookstore
                        </v-btn>
                    </router-link>
                </v-col>

                <v-spacer></v-spacer>

                <!-- Navigation Links -->
                <v-col cols="auto">
                    <v-btn variant="text" to="/books">Books</v-btn>
                    <v-btn variant="text" to="/authors">Authors</v-btn>
                    <v-btn variant="text" to="/contact">Contact</v-btn>
                </v-col>

                <!-- Auth Section -->
                <v-col cols="auto">
                    <template v-if="isAuthenticated">
                        <!-- Cart Icon -->
                        <v-btn variant="text" to="/cart" icon>
                            <v-badge :content="cartItemsCount" color="red" v-if="cartItemsCount > 0">
                                <v-icon>mdi-cart</v-icon>
                            </v-badge>
                            <v-icon v-else>mdi-cart</v-icon>
                        </v-btn>

                        <!-- User Menu -->
                        <v-menu>
                            <template v-slot:activator="{ props }">
                                <v-btn variant="text" v-bind="props">
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
                        <v-btn variant="text" to="/login">Login</v-btn>
                        <v-btn variant="outlined" to="/register">Register</v-btn>
                    </template>
                </v-col>
            </v-row>
        </v-container>
    </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore, useCartStore } from '@/store'
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