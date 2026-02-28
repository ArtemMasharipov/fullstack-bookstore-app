<template>
    <v-app-bar app color="primary" elevation="2">
        <v-container class="py-0 px-2 d-flex align-center">
            <!-- Mobile hamburger -->
            <v-app-bar-nav-icon
                class="d-md-none text-white"
                aria-label="Open navigation menu"
                @click="drawer = !drawer"
            />

            <!-- Logo/Brand -->
            <router-link to="/" class="text-decoration-none text-white d-flex align-center">
                <v-btn variant="text" size="large" class="text-h6 font-weight-bold text-white"> Bookstore </v-btn>
            </router-link>

            <v-spacer />

            <!-- Desktop Navigation Links -->
            <div class="d-none d-md-flex align-center ga-1">
                <v-btn variant="text" to="/books" class="text-white">Books</v-btn>
                <v-btn variant="text" to="/authors" class="text-white">Authors</v-btn>
            </div>

            <v-spacer class="d-none d-md-block" />

            <!-- Dark mode toggle -->
            <v-btn
                variant="text"
                icon
                class="text-white"
                :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
                @click="toggleTheme"
            >
                <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            </v-btn>

            <!-- Cart Icon (visible for all users) -->
            <v-btn variant="text" to="/cart" icon class="text-white" aria-label="Shopping cart">
                <v-badge :content="cartItemsCount" color="secondary" v-if="cartItemsCount > 0">
                    <v-icon>mdi-cart</v-icon>
                </v-badge>
                <v-icon v-else>mdi-cart-outline</v-icon>
            </v-btn>

            <!-- Auth Section (Desktop) -->
            <div class="d-none d-md-flex align-center">
                <template v-if="isAuthenticated">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" class="text-white">
                                <v-avatar size="28" color="secondary" class="mr-2">
                                    <span class="text-caption font-weight-bold">{{ userInitials }}</span>
                                </v-avatar>
                                {{ user?.name }}
                                <v-icon end size="small">mdi-chevron-down</v-icon>
                            </v-btn>
                        </template>
                        <v-list density="compact" rounded="lg" elevation="3" min-width="180">
                            <v-list-item to="/profile" prepend-icon="mdi-account-outline">
                                <v-list-item-title>Profile</v-list-item-title>
                            </v-list-item>
                            <v-list-item to="/orders" prepend-icon="mdi-package-variant-closed">
                                <v-list-item-title>My Orders</v-list-item-title>
                            </v-list-item>
                            <v-list-item v-if="isAdmin" to="/admin" prepend-icon="mdi-shield-crown-outline">
                                <v-list-item-title>Admin Panel</v-list-item-title>
                            </v-list-item>
                            <v-divider class="my-1" />
                            <v-list-item @click="logout" prepend-icon="mdi-logout">
                                <v-list-item-title>Logout</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>

                <template v-else>
                    <v-btn variant="text" to="/login" class="text-white">Login</v-btn>
                    <v-btn variant="outlined" to="/register" class="text-white ml-1">Register</v-btn>
                </template>
            </div>
        </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary location="left">
        <v-list density="compact" nav>
            <v-list-item prepend-icon="mdi-home-outline" title="Home" to="/" @click="drawer = false" />
            <v-list-item
                prepend-icon="mdi-book-open-page-variant-outline"
                title="Books"
                to="/books"
                @click="drawer = false"
            />
            <v-list-item
                prepend-icon="mdi-account-group-outline"
                title="Authors"
                to="/authors"
                @click="drawer = false"
            />

            <v-divider class="my-2" />

            <template v-if="isAuthenticated">
                <v-list-item prepend-icon="mdi-account-outline" title="Profile" to="/profile" @click="drawer = false" />
                <v-list-item
                    prepend-icon="mdi-package-variant-closed"
                    title="My Orders"
                    to="/orders"
                    @click="drawer = false"
                />
                <v-list-item
                    v-if="isAdmin"
                    prepend-icon="mdi-shield-crown-outline"
                    title="Admin Panel"
                    to="/admin"
                    @click="drawer = false"
                />
                <v-divider class="my-2" />
                <v-list-item prepend-icon="mdi-logout" title="Logout" @click="handleLogout" />
            </template>

            <template v-else>
                <v-list-item prepend-icon="mdi-login" title="Login" to="/login" @click="drawer = false" />
                <v-list-item
                    prepend-icon="mdi-account-plus-outline"
                    title="Register"
                    to="/register"
                    @click="drawer = false"
                />
            </template>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'

const router = useRouter()
const theme = useTheme()
const authStore = useAuthStore()
const cartStore = useCartStore()

const isDark = computed(() => theme.global.current.value.dark)
const toggleTheme = () => {
    theme.global.name.value = isDark.value ? 'light' : 'dark'
}

const { isAuthenticated, user } = storeToRefs(authStore)

const drawer = ref(false)
const isAdmin = computed(() => user.value?.role === 'admin')
const cartItemsCount = computed(() => cartStore.totalQuantity)
const userInitials = computed(() => {
    const name = user.value?.name || ''
    return (
        name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'U'
    )
})

const logout = async () => {
    await authStore.logout()
    router.push('/')
}

const handleLogout = () => {
    logout()
    drawer.value = false
}
</script>

<style scoped>
.v-app-bar .v-btn.text-white {
    color: white !important;
}

.v-app-bar .v-btn--variant-outlined.text-white {
    border-color: rgba(255, 255, 255, 0.6) !important;
}

.v-app-bar .v-btn--variant-outlined.text-white:hover {
    background-color: rgba(255, 255, 255, 0.12) !important;
    border-color: white !important;
}
</style>
