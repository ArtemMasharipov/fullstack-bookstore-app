<template>
    <v-app-bar color="primary" elevation="2" app>
        <v-app-bar-nav-icon
            @click="drawer = !drawer"
            class="d-flex d-md-none"
            color="white"
            aria-label="Toggle navigation menu"
        ></v-app-bar-nav-icon>
        
        <v-app-bar-title>
            <router-link to="/" class="text-white text-decoration-none font-weight-bold">
                BookStore
            </router-link>
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <!-- Desktop navigation menu -->
        <nav class="d-none d-md-flex align-center">
            <v-btn 
                v-for="item in navigationItems" 
                :key="item.path"
                :to="item.path" 
                variant="text" 
                class="text-white"
                :prepend-icon="item.icon"
                :disabled="item.requiresAuth && !isAuthenticated"
            >
                {{ item.title }}
            </v-btn>
            
            <template v-if="isAuthenticated">
                <v-menu transition="slide-y-transition" open-on-hover>
                    <template v-slot:activator="{ props }">
                        <v-chip
                            class="ml-2 pa-2"
                            color="secondary"
                            text-color="white"
                            v-bind="props"
                        >
                            <v-avatar start>
                                <v-icon icon="mdi-account-circle"></v-icon>
                            </v-avatar>
                            {{ currentUser?.username }}
                        </v-chip>
                    </template>
                    <v-list density="compact">
                        <v-list-item to="/orders" prepend-icon="mdi-package">
                            <v-list-item-title>My Orders</v-list-item-title>
                        </v-list-item>
                        <v-divider></v-divider>
                        <v-list-item @click="handleLogout" prepend-icon="mdi-logout">
                            <v-list-item-title>Logout</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
            
            <template v-else>
                <v-btn to="/login" variant="text" class="text-white" prepend-icon="mdi-login">
                    Login
                </v-btn>
                
                <v-btn to="/register" variant="outlined" color="secondary" class="ml-2">
                    Register
                </v-btn>
            </template>
        </nav>

        <!-- Mobile drawer menu -->
        <v-navigation-drawer
            v-model="drawer"
            temporary
            location="left"
            width="280"
            theme="dark"
        >
            <v-list-item prepend-avatar="/favicon.ico">
                <v-list-item-title class="text-h6">
                    BookStore
                </v-list-item-title>
                <v-list-item-subtitle>
                    Book Shopping Platform
                </v-list-item-subtitle>
                
                <template v-slot:append>
                    <v-btn 
                        icon="mdi-close" 
                        variant="text" 
                        @click="drawer = false"
                        aria-label="Close menu"
                    ></v-btn>
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
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
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
                        <v-list-item-title>{{ currentUser?.username }}</v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item to="/orders" @click="drawer = false" prepend-icon="mdi-package">
                        <v-list-item-title>My Orders</v-list-item-title>
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
import { useAuthStore } from '@/stores';

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
                { title: 'Contact', path: '/contact', icon: 'mdi-email', requiresAuth: false }
            ]
        }
    },
    computed: {
        /**
         * Access to auth store
         */
        authStore() {
            return useAuthStore();
        },
        
        /**
         * Check if user is authenticated
         */
        isAuthenticated() {
            return this.authStore.isAuthenticated;
        },
        
        /**
         * Get current user information
         */
        currentUser() {
            return this.authStore.currentUser;
        },
        
        /**
         * Generate user initials for avatar
         */
        userInitials() {
            if (!this.currentUser?.username) return '?';
            
            return this.currentUser.username
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
        }
    },
    methods: {
        /**
         * Handle logout action
         */
        async handleLogout() {
            await this.authStore.logout();
            this.$router.push('/login');
        },
        
        /**
         * Handle logout from mobile drawer
         */
        async handleLogoutAndCloseDrawer() {
            this.drawer = false;
            await this.handleLogout();
        }
    }
};
</script>
