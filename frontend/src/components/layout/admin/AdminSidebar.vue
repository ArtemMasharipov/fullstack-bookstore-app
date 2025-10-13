<template>
    <v-navigation-drawer v-model="drawer" permanent color="grey-lighten-5" width="280" class="admin-sidebar">
        <!-- Sidebar Header -->
        <v-list-item class="pa-4 bg-primary">
            <template v-slot:prepend>
                <v-icon color="white" size="large">mdi-view-dashboard</v-icon>
            </template>
            <v-list-item-title class="text-white text-h6 font-weight-medium"> Admin Dashboard </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <!-- Navigation Menu -->
        <v-list density="compact" nav>
            <v-list-item
                v-for="item in menuItems"
                :key="item.title"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                :subtitle="item.subtitle"
                class="mb-1"
                rounded="xl"
            >
                <template v-slot:append v-if="item.badge">
                    <v-badge :content="item.badge" color="error" inline></v-badge>
                </template>
            </v-list-item>
        </v-list>

        <v-divider class="my-4"></v-divider>

        <!-- System Section -->
        <v-list density="compact" nav>
            <v-list-subheader>System</v-list-subheader>

            <v-list-item
                v-for="item in systemItems"
                :key="item.title"
                :to="item.to"
                :prepend-icon="item.icon"
                :title="item.title"
                class="mb-1"
                rounded="xl"
            ></v-list-item>
        </v-list>

        <!-- Footer -->
        <template v-slot:append>
            <div class="pa-4 text-center">
                <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-shield-check">
                    Admin Access
                </v-chip>
                <div class="text-caption text-grey mt-2">Bookstore v2.0</div>
            </div>
        </template>
    </v-navigation-drawer>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * AdminSidebar component - Admin panel navigation sidebar
 */

// Router
const router = useRouter()
const route = useRoute()

// Reactive state
const drawer = ref(true)

// Navigation items
const menuItems = computed(() => [
    {
        title: 'Dashboard',
        subtitle: 'Overview & stats',
        icon: 'mdi-view-dashboard',
        to: '/admin',
    },
    {
        title: 'Books',
        subtitle: 'Manage inventory',
        icon: 'mdi-book-multiple',
        to: '/admin/books',
    },
    {
        title: 'Authors',
        subtitle: 'Author profiles',
        icon: 'mdi-account-edit',
        to: '/admin/authors',
    },
    {
        title: 'Orders',
        subtitle: 'Customer orders',
        icon: 'mdi-cart',
        to: '/admin/orders',
        badge: '5', // Get from store
    },
    {
        title: 'Users',
        subtitle: 'User accounts',
        icon: 'mdi-account-group',
        to: '/admin/users',
    },
])

const systemItems = computed(() => [
    {
        title: 'Settings',
        icon: 'mdi-cog',
        to: '/admin/settings',
    },
    {
        title: 'Logs',
        icon: 'mdi-text-box-multiple',
        to: '/admin/logs',
    },
    {
        title: 'Reports',
        icon: 'mdi-chart-line',
        to: '/admin/reports',
    },
])
</script>

<style scoped>
.admin-sidebar {
    border-right: 1px solid rgba(0, 0, 0, 0.05);
}

.v-list-item--active {
    background-color: rgba(var(--v-theme-primary), 0.1);
    color: rgb(var(--v-theme-primary));
}

.v-list-item--active .v-icon {
    color: rgb(var(--v-theme-primary));
}
</style>
