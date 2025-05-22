<template>
    <div class="admin-layout">
        <!-- Admin sidebar navigation -->
        <v-navigation-drawer v-model="drawer" permanent width="280" class="admin-sidebar" color="grey-darken-4">
            <v-list-item prepend-avatar="/favicon.ico" title="Admin Dashboard" subtitle="BookStore Management">
                <template v-slot:append>
                    <v-btn variant="text" icon="mdi-home" :to="{ path: '/' }" color="white">
                        <v-tooltip activator="parent" location="bottom">Return to main site</v-tooltip>
                    </v-btn>
                </template>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list nav density="compact" color="primary">
                <v-list-item
                    v-for="(item, i) in navigationItems"
                    :key="i"
                    :to="item.path"
                    :prepend-icon="item.icon"
                    :title="item.title"
                    rounded="lg"
                    color="grey"
                    class="mb-1"
                ></v-list-item>
            </v-list>

            <template v-slot:append>
                <div class="pa-2">
                    <v-btn block prepend-icon="mdi-logout" color="error" variant="tonal" @click="logout">
                        Logout
                    </v-btn>
                </div>
            </template>
        </v-navigation-drawer>

        <!-- Main content area -->
        <div class="admin-content">
            <v-app-bar color="grey-darken-3" elevation="2" flat density="comfortable">
                <v-app-bar-title>{{ currentPageTitle }}</v-app-bar-title>

                <v-spacer></v-spacer>

                <v-avatar color="primary" class="mr-2">
                    <v-icon>mdi-account</v-icon>
                </v-avatar>

                <div class="text-caption text-white">{{ userName }}</div>
            </v-app-bar>
            <v-main class="admin-main">
                <div class="admin-outlet pa-4">
                    <!-- Admin content with error boundary -->
                    <admin-error-boundary>
                        <slot></slot>
                    </admin-error-boundary>
                </div>
            </v-main>
        </div>
    </div>
</template>

<script>
import AdminErrorBoundary from '@/components/features/admin/AdminErrorBoundary.vue'
import { useAuthStore } from '@/store'

export default {
    name: 'AdminLayout',

    components: {
        AdminErrorBoundary,
    },

    data() {
        return {
            drawer: true,
            navigationItems: [
                { title: 'Dashboard', path: '/admin', icon: 'mdi-view-dashboard' },
                { title: 'Books', path: '/admin/books', icon: 'mdi-book-multiple' },
                { title: 'Authors', path: '/admin/authors', icon: 'mdi-account-group' },
                { title: 'Orders', path: '/admin/orders', icon: 'mdi-package-variant' },
                { title: 'Users', path: '/admin/users', icon: 'mdi-account-multiple' },
                { title: 'Settings', path: '/admin/settings', icon: 'mdi-cog' },
            ],
        }
    },

    computed: {
        // Get current route path for highlighting active menu item
        currentRoute() {
            return this.$route.path
        },

        // Get the title for the current page
        currentPageTitle() {
            const currentPath = this.currentRoute
            const currentItem = this.navigationItems.find((item) => currentPath.startsWith(item.path))
            return currentItem ? currentItem.title : 'Admin'
        },

        // Get authenticated user's name
        userName() {
            const authStore = useAuthStore()
            const user = authStore.currentUser
            return user ? user.name || user.username || user.email : 'Admin'
        },
    },

    methods: {
        // Handle user logout
        async logout() {
            const authStore = useAuthStore()
            await authStore.logout()
            this.$router.push('/login')
        },
    },
}
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
}

.admin-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: #f5f5f5;
}

.admin-main {
    height: calc(100vh - 64px);
    overflow-y: auto;
}

.admin-outlet {
    max-width: 1200px;
    margin: 0 auto;
}

/* Override Vuetify styles for admin panel */
:deep(.v-navigation-drawer__content) {
    display: flex;
    flex-direction: column;
}
</style>
