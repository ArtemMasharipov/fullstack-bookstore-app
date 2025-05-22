<template>
    <v-app-bar color="primary" elevation="2" app>
        <v-app-bar-nav-icon
            @click="drawer = !drawer"
            class="d-flex d-md-none"
            color="white"
            aria-label="Toggle navigation menu"
        ></v-app-bar-nav-icon>

        <v-app-bar-title>
            <router-link to="/" class="text-white text-decoration-none font-weight-bold"> BookStore </router-link>
        </v-app-bar-title>

        <v-spacer></v-spacer>
        <!-- Desktop navigation menu -->
        <nav class="d-none d-md-flex align-center">
            <template v-for="item in navigationItems" :key="item.path">
                <v-btn
                    :to="item.path"
                    variant="text"
                    class="text-white"
                    :prepend-icon="item.icon"
                    :disabled="item.requiresAuth && !isAuthenticated"
                >
                    {{ item.title }}
                    <v-tooltip
                        v-if="item.path === '/cart' && cartBadgeContent > 0"
                        activator="parent"
                        location="bottom"
                    >
                        {{
                            totalQuantity === itemCount
                                ? `${cartBadgeContent} item${cartBadgeContent > 1 ? 's' : ''} in cart`
                                : `${itemCount} item${itemCount > 1 ? 's' : ''} (${totalQuantity} total) in cart`
                        }}
                    </v-tooltip>
                    <v-badge
                        v-if="item.path === '/cart' && cartBadgeContent > 0"
                        :content="cartBadgeContent"
                        color="error"
                        floating
                        dot-size="8"
                        offset-x="2"
                        offset-y="2"
                        class="cart-badge"
                    ></v-badge>
                </v-btn>
            </template>

            <template v-if="isAuthenticated">
                <v-menu transition="slide-y-transition" open-on-hover>
                    <template v-slot:activator="{ props }">
                        <v-chip class="ml-2 pa-2" color="secondary" text-color="white" v-bind="props">
                            <v-avatar start>
                                <v-icon icon="mdi-account-circle"></v-icon>
                            </v-avatar>
                            <span>{{ getUserDisplayName }}</span>
                        </v-chip>
                    </template>
                    <v-list density="compact">
                        <v-list-item to="/orders" prepend-icon="mdi-package">
                            <v-list-item-title>My Orders</v-list-item-title>
                        </v-list-item>
                        <v-list-item
                            v-if="authStore.hasPermission('admin:access')"
                            to="/admin"
                            prepend-icon="mdi-shield-account"
                        >
                            <v-list-item-title>Admin Panel</v-list-item-title>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item @click="logout" prepend-icon="mdi-logout">
                            <v-list-item-title>Logout</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>

            <template v-else>
                <v-btn to="/login" variant="text" class="text-white" prepend-icon="mdi-login"> Login </v-btn>

                <v-btn to="/register" variant="outlined" color="secondary" class="ml-2"> Register </v-btn>
            </template>
        </nav>

        <!-- Mobile drawer menu -->
        <v-navigation-drawer v-model="drawer" temporary location="left" width="280" theme="dark">
            <v-list-item prepend-avatar="/favicon.ico">
                <v-list-item-title class="text-h6"> BookStore </v-list-item-title>
                <v-list-item-subtitle> Book Shopping Platform </v-list-item-subtitle>

                <template v-slot:append>
                    <v-btn icon="mdi-close" variant="text" @click="drawer = false" aria-label="Close menu"></v-btn>
                </template>
            </v-list-item>

            <v-divider></v-divider>
            <v-list nav>
                <v-list-item
                    v-for="item in navigationItems"
                    :key="item.path"
                    :to="item.path"
                    :prepend-icon="item.icon"
                    :disabled="item.requiresAuth && !isAuthenticated"
                    @click="drawer = false"
                >
                    <v-list-item-title>
                        {{ item.title }}
                        <v-tooltip
                            v-if="item.path === '/cart' && cartBadgeContent > 0"
                            activator="parent"
                            location="end"
                        >
                            {{
                                totalQuantity === itemCount
                                    ? `${cartBadgeContent} item${cartBadgeContent > 1 ? 's' : ''} in cart`
                                    : `${itemCount} item${itemCount > 1 ? 's' : ''} (${totalQuantity} total) in cart`
                            }}
                        </v-tooltip>
                        <v-badge
                            v-if="item.path === '/cart' && cartBadgeContent > 0"
                            :content="cartBadgeContent"
                            color="error"
                            inline
                            class="ml-2 cart-badge"
                        ></v-badge>
                    </v-list-item-title>
                </v-list-item>

                <v-divider class="my-2"></v-divider>

                <template v-if="isAuthenticated">
                    <v-list-subheader>User Account</v-list-subheader>

                    <v-list-item>
                        <template v-slot:prepend>
                            <v-avatar size="small" color="secondary">
                                <span class="text-white">{{ userInitials }}</span>
                            </v-avatar>
                        </template>
                        <v-list-item-title>{{ getUserDisplayName }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item to="/orders" @click="drawer = false" prepend-icon="mdi-package">
                        <v-list-item-title>My Orders</v-list-item-title>
                    </v-list-item>

                    <v-list-item
                        v-if="authStore.hasPermission('admin:access')"
                        to="/admin"
                        @click="drawer = false"
                        prepend-icon="mdi-shield-account"
                    >
                        <v-list-item-title>Admin Panel</v-list-item-title>
                    </v-list-item>

                    <v-list-item @click="handleLogoutAndCloseDrawer" prepend-icon="mdi-logout">
                        <v-list-item-title>Logout</v-list-item-title>
                    </v-list-item>
                </template>

                <template v-else>
                    <v-list-subheader>Account</v-list-subheader>

                    <v-list-item to="/login" @click="drawer = false" prepend-icon="mdi-login">
                        <v-list-item-title>Login</v-list-item-title>
                    </v-list-item>

                    <v-list-item to="/register" @click="drawer = false" prepend-icon="mdi-account-plus">
                        <v-list-item-title>Register</v-list-item-title>
                    </v-list-item>
                </template>
            </v-list>
        </v-navigation-drawer>
    </v-app-bar>
</template>

<script>
import { useAuthStore, useAuthUiStore, useCartStore } from '@/store'

/**
 * Main navigation component for the application
 * Provides responsive navigation for both desktop and mobile views
 */
export default {
    name: 'NavBar',
    data() {
        return {
            drawer: false,
            navigationItems: [
                { title: 'Home', path: '/', icon: 'mdi-home', requiresAuth: false },
                { title: 'Books', path: '/books', icon: 'mdi-book', requiresAuth: false },
                { title: 'Authors', path: '/authors', icon: 'mdi-account-multiple', requiresAuth: false },
                { title: 'Cart', path: '/cart', icon: 'mdi-cart', requiresAuth: false },
                { title: 'About', path: '/about', icon: 'mdi-information', requiresAuth: false },
                { title: 'Contact', path: '/contact', icon: 'mdi-email', requiresAuth: false },
            ],
        }
    },
    computed: {
        authStore() {
            return useAuthStore()
        },
        authUiStore() {
            return useAuthUiStore()
        },
        cartStore() {
            return useCartStore()
        },
        isAuthenticated() {
            return this.authStore.isAuthenticated
        },
        currentUser() {
            return this.authStore.currentUser
        },
        itemCount() {
            return this.cartStore.itemCount
        },
        totalQuantity() {
            return this.cartStore.totalQuantity
        },

        /**
         * Get cart badge content - either unique items count or total quantity
         * Uses unique item count as default, or total quantity if showTotalQuantity is true
         */
        cartBadgeContent() {
            // Could be configurable through user preferences or app settings
            const showTotalQty = false // Set to true to show total quantity instead of unique items
            return showTotalQty ? this.totalQuantity : this.itemCount
        },

        /**
         * Generate user initials for avatar
         */
        userInitials() {
            if (!this.currentUser?.username) return '?'

            return this.currentUser.username
                .split(' ')
                .map((name) => name[0])
                .join('')
                .toUpperCase()
                .substring(0, 2)
        },

        /**
         * Get formatted user display name with role
         */
        getUserDisplayName() {
            if (!this.currentUser) return 'Guest'

            const username = this.currentUser.name || this.currentUser.username || 'User'
            const email = this.currentUser.email

            // Отображаем email в скобках, если он доступен
            return email ? `${username} (${email})` : username
        },
    },
    watch: {
        // Update cart count when route changes
        '$route.path': {
            handler(newPath) {
                // Always refresh cart data when navigating between pages
                // This ensures the cart badge is always up-to-date
                this.fetchCart()
            },
        },
        // Наблюдаем за изменениями в состоянии авторизации
        isAuthenticated(newVal, oldVal) {
            if (newVal !== oldVal) {
                // Если состояние авторизации изменилось, обновляем корзину
                this.fetchCart()
            }
        },
    },
    created() {
        // Fetch cart items to display accurate count
        this.fetchCart()

        // Set up polling to ensure cart badge is always updated
        this.cartUpdateInterval = setInterval(() => {
            // Only update if user is active (hasn't been inactive for more than 5 minutes)
            if (document.visibilityState === 'visible') {
                this.fetchCart()
            }
        }, 30000) // Update every 30 seconds when page is visible
    },

    beforeUnmount() {
        // Clear interval when component is unmounted
        if (this.cartUpdateInterval) {
            clearInterval(this.cartUpdateInterval)
        }
    },
    methods: {
        /**
         * Fetch cart items
         */
        fetchCart() {
            this.cartStore.fetchCart()
        },

        /**
         * Handle logout action
         */
        async logout() {
            await this.authUiStore.handleLogout()
            this.$router.push('/login')
        },

        /**
         * Handle logout from mobile drawer
         */
        async handleLogoutAndCloseDrawer() {
            this.drawer = false
            await this.logout()
        },
    },
}
</script>

<style scoped>
.cart-badge :deep(.v-badge__content) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: pulse 1s;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.2);
    }
    100% {
        transform: scale(1);
    }
}
</style>
