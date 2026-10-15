<template>
    <v-app-bar app color="primary" elevation="2">
        <v-container class="py-0 px-2 d-flex align-center">
            <!-- Mobile hamburger -->
            <v-app-bar-nav-icon
                class="d-md-none text-white"
                :aria-label="t('nav.openMenu')"
                @click="drawer = !drawer"
            />

            <!-- Logo/Brand -->
            <router-link :to="localeRoute('Home')" class="text-decoration-none text-white d-flex align-center">
                <v-btn variant="text" size="large" class="text-h6 font-weight-bold text-white"> Bookstore </v-btn>
            </router-link>

            <v-spacer />

            <!-- Desktop Navigation Links -->
            <div class="d-none d-md-flex align-center ga-1">
                <v-btn variant="text" :to="localeRoute('Books')" class="text-white">{{ t('routes.Books') }}</v-btn>
                <v-btn variant="text" :to="localeRoute('Authors')" class="text-white">{{ t('routes.Authors') }}</v-btn>
            </div>

            <v-spacer class="d-none d-md-block" />

            <LanguageSwitcher class="text-white mr-1" />

            <!-- Dark mode toggle -->
            <v-btn
                variant="text"
                icon
                class="text-white"
                :aria-label="t(isDark ? 'nav.lightMode' : 'nav.darkMode')"
                @click="toggleTheme"
            >
                <v-icon>{{ isDark ? 'mdi-weather-sunny' : 'mdi-weather-night' }}</v-icon>
            </v-btn>

            <!-- Cart Icon (visible for all users) -->
            <v-btn variant="text" :to="localeRoute('Cart')" icon class="text-white" :aria-label="t('nav.cart')">
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
                            <v-list-item :to="localeRoute('Profile')" prepend-icon="mdi-account-outline">
                                <v-list-item-title>{{ t('routes.Profile') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item :to="localeRoute('Orders')" prepend-icon="mdi-package-variant-closed">
                                <v-list-item-title>{{ t('routes.Orders') }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item
                                v-if="isAdmin"
                                :to="localeRoute('AdminDashboard')"
                                prepend-icon="mdi-shield-crown-outline"
                            >
                                <v-list-item-title>{{ t('nav.admin') }}</v-list-item-title>
                            </v-list-item>
                            <v-divider class="my-1" />
                            <v-list-item @click="logout" prepend-icon="mdi-logout">
                                <v-list-item-title>{{ t('nav.logout') }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>

                <template v-else>
                    <v-btn variant="text" :to="localeRoute('Login')" class="text-white">{{ t('routes.Login') }}</v-btn>
                    <v-btn variant="outlined" :to="localeRoute('Register')" class="text-white ml-1">{{
                        t('routes.Register')
                    }}</v-btn>
                </template>
            </div>
        </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" temporary location="left">
        <v-list density="compact" nav>
            <v-list-item
                prepend-icon="mdi-home-outline"
                :title="t('routes.Home')"
                :to="localeRoute('Home')"
                @click="drawer = false"
            />
            <v-list-item
                prepend-icon="mdi-book-open-page-variant-outline"
                :title="t('routes.Books')"
                :to="localeRoute('Books')"
                @click="drawer = false"
            />
            <v-list-item
                prepend-icon="mdi-account-group-outline"
                :title="t('routes.Authors')"
                :to="localeRoute('Authors')"
                @click="drawer = false"
            />

            <v-divider class="my-2" />

            <template v-if="isAuthenticated">
                <v-list-item
                    prepend-icon="mdi-account-outline"
                    :title="t('routes.Profile')"
                    :to="localeRoute('Profile')"
                    @click="drawer = false"
                />
                <v-list-item
                    prepend-icon="mdi-package-variant-closed"
                    :title="t('routes.Orders')"
                    :to="localeRoute('Orders')"
                    @click="drawer = false"
                />
                <v-list-item
                    v-if="isAdmin"
                    prepend-icon="mdi-shield-crown-outline"
                    :title="t('nav.admin')"
                    :to="localeRoute('AdminDashboard')"
                    @click="drawer = false"
                />
                <v-divider class="my-2" />
                <v-list-item prepend-icon="mdi-logout" :title="t('nav.logout')" @click="handleLogout" />
            </template>

            <template v-else>
                <v-list-item
                    prepend-icon="mdi-login"
                    :title="t('routes.Login')"
                    :to="localeRoute('Login')"
                    @click="drawer = false"
                />
                <v-list-item
                    prepend-icon="mdi-account-plus-outline"
                    :title="t('routes.Register')"
                    :to="localeRoute('Register')"
                    @click="drawer = false"
                />
            </template>
        </v-list>
    </v-navigation-drawer>
</template>

<script setup>
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
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
    const next = isDark.value ? 'light' : 'dark'
    theme.global.name.value = next
    localStorage.setItem('bookstore-theme', next)
}

// Restore saved theme on load
const savedTheme = localStorage.getItem('bookstore-theme')
if (savedTheme === 'dark' || savedTheme === 'light') {
    theme.global.name.value = savedTheme
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
    router.push(localeRoute('Home'))
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
