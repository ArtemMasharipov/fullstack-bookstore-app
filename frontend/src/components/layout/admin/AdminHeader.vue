<template>
    <v-app-bar color="primary" dark flat :height="xs ? 160 : 64" :order="xs ? -1 : 0">
        <v-container class="py-0">
            <v-row align="center" no-gutters class="admin-header-row">
                <!-- Admin Panel Title -->
                <v-col cols="auto" class="admin-title">
                    <h2 class="text-h6 font-weight-medium">{{ t('nav.admin') }}</h2>
                </v-col>

                <v-spacer></v-spacer>

                <!-- Search Bar -->
                <v-col cols="auto" class="admin-search mr-4">
                    <v-text-field
                        v-model="searchQuery"
                        :placeholder="t('nav.search')"
                        prepend-inner-icon="mdi-magnify"
                        variant="outlined"
                        density="compact"
                        hide-details
                        clearable
                        style="max-width: 300px"
                        @input="handleSearch"
                    ></v-text-field>
                </v-col>

                <v-col cols="auto" class="admin-languages mr-2"><LanguageSwitcher /></v-col>

                <!-- User Menu -->
                <v-col cols="auto" class="admin-user">
                    <v-menu>
                        <template v-slot:activator="{ props }">
                            <v-btn variant="text" v-bind="props" class="text-none">
                                <v-icon left icon="mdi-account-circle"></v-icon>
                                {{ user?.name || user?.username || t('admin.userFallback') }}
                                <v-icon right icon="mdi-chevron-down"></v-icon>
                            </v-btn>
                        </template>

                        <v-list>
                            <v-list-item :to="localeRoute('Profile')">
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-account"></v-icon>
                                </template>
                                <v-list-item-title>{{ t('routes.Profile') }}</v-list-item-title>
                            </v-list-item>

                            <v-list-item :to="localeRoute('AdminSettings')">
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-cog"></v-icon>
                                </template>
                                <v-list-item-title>{{ t('routes.AdminSettings') }}</v-list-item-title>
                            </v-list-item>

                            <v-divider></v-divider>

                            <v-list-item :to="localeRoute('Home')">
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-home"></v-icon>
                                </template>
                                <v-list-item-title>{{ t('nav.returnStore') }}</v-list-item-title>
                            </v-list-item>

                            <v-divider></v-divider>

                            <v-list-item @click="logout">
                                <template v-slot:prepend>
                                    <v-icon icon="mdi-logout"></v-icon>
                                </template>
                                <v-list-item-title>{{ t('nav.logout') }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </v-col>
            </v-row>
        </v-container>
    </v-app-bar>
</template>

<script setup>
import LanguageSwitcher from '@/components/layout/LanguageSwitcher.vue'
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import { useAuthStore } from '@/stores'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useDisplay } from 'vuetify'

/**
 * AdminHeader component - Admin panel header with navigation and user menu
 */

const { xs } = useDisplay()

// Stores
const authStore = useAuthStore()

// Reactive state
const { user } = storeToRefs(authStore)
const searchQuery = ref('')

// Methods
const handleSearch = (query) => {
    // Emit search event or handle global search functionality
    logger.debug('Admin search initiated', { query }, 'admin-header')
    // Global admin search functionality
}

// Every admin page needs an account, so the session's end opens Login
const logout = () => authStore.logout()
</script>

<style scoped>
.v-app-bar {
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
@media (max-width: 599px) {
    .admin-header-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 4px;
    }

    .admin-header-row > .v-spacer {
        display: none;
    }

    .admin-title {
        grid-area: 1 / 1;
    }

    .admin-user {
        grid-area: 1 / 2;
    }

    .admin-search {
        grid-area: 2 / 1 / 3 / 3;
        width: 100%;
        margin-right: 0 !important;
    }

    .admin-languages {
        grid-area: 3 / 1 / 4 / 3;
        justify-self: center;
        margin-right: 0 !important;
    }
}
</style>
