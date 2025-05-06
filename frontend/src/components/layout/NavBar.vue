<template>
    <v-app-bar color="primary" :elevation="2" app>
        <!-- Кнопка мобильного меню, видимая только на маленьких экранах -->
        <v-app-bar-nav-icon
            @click="drawer = !drawer"
            class="d-flex d-md-none"
            color="white"
        ></v-app-bar-nav-icon>
        
        <v-app-bar-title>
            <router-link to="/" class="text-white text-decoration-none">BookStore</router-link>
        </v-app-bar-title>

        <v-spacer></v-spacer>

        <!-- Desktop меню - скрыто на маленьких экранах -->
        <div class="d-none d-md-flex align-center">
            <v-btn to="/" variant="text" class="text-white">
                Home
            </v-btn>
            
            <v-btn to="/books" variant="text" class="text-white">
                Books
            </v-btn>
            
            <v-btn to="/authors" variant="text" class="text-white">
                Authors
            </v-btn>
            
            <v-btn to="/cart" variant="text" class="text-white">
                Cart
            </v-btn>

            <v-btn to="/about" variant="text" class="text-white">
                About
            </v-btn>

            <v-btn to="/contact" variant="text" class="text-white">
                Contact
            </v-btn>
            
            <template v-if="isAuthenticated">
                <v-menu>
                    <template v-slot:activator="{ props }">
                        <v-chip
                            class="mx-2"
                            color="secondary"
                            text-color="white"
                            v-bind="props"
                        >
                            {{ currentUser?.username }}
                        </v-chip>
                    </template>
                    <v-list>
                        <v-list-item to="/orders">
                            <v-list-item-title>My Orders</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="handleLogout">
                            <v-list-item-title>Logout</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-menu>
            </template>
            
            <template v-else>
                <v-btn to="/login" variant="text" class="text-white">
                    Login
                </v-btn>
                
                <v-btn to="/register" variant="outlined" color="secondary" class="ml-2">
                    Register
                </v-btn>
            </template>
        </div>

        <!-- Мобильное меню для маленьких экранов -->
        <v-navigation-drawer
            v-model="drawer"
            temporary
            location="left"
            width="250"
        >
            <v-list-item>
                <v-list-item-title class="text-h6">
                    BookStore Menu
                </v-list-item-title>
            </v-list-item>

            <v-divider></v-divider>

            <v-list nav>
                <v-list-item to="/" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-home</v-icon>
                    </template>
                    <v-list-item-title>Home</v-list-item-title>
                </v-list-item>

                <v-list-item to="/books" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-book</v-icon>
                    </template>
                    <v-list-item-title>Books</v-list-item-title>
                </v-list-item>

                <v-list-item to="/authors" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-account-multiple</v-icon>
                    </template>
                    <v-list-item-title>Authors</v-list-item-title>
                </v-list-item>

                <v-list-item to="/cart" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-cart</v-icon>
                    </template>
                    <v-list-item-title>Cart</v-list-item-title>
                </v-list-item>

                <v-list-item to="/about" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-information</v-icon>
                    </template>
                    <v-list-item-title>About</v-list-item-title>
                </v-list-item>

                <v-list-item to="/contact" @click="drawer = false">
                    <template v-slot:prepend>
                        <v-icon>mdi-email</v-icon>
                    </template>
                    <v-list-item-title>Contact</v-list-item-title>
                </v-list-item>

                <v-divider></v-divider>

                <template v-if="isAuthenticated">
                    <v-list-item to="/orders" @click="drawer = false">
                        <template v-slot:prepend>
                            <v-icon>mdi-package</v-icon>
                        </template>
                        <v-list-item-title>My Orders</v-list-item-title>
                    </v-list-item>
                    
                    <v-list-item @click="handleLogoutAndCloseDrawer">
                        <template v-slot:prepend>
                            <v-icon>mdi-logout</v-icon>
                        </template>
                        <v-list-item-title>Logout ({{ currentUser?.username }})</v-list-item-title>
                    </v-list-item>
                </template>
                
                <template v-else>
                    <v-list-item to="/login" @click="drawer = false">
                        <template v-slot:prepend>
                            <v-icon>mdi-login</v-icon>
                        </template>
                        <v-list-item-title>Login</v-list-item-title>
                    </v-list-item>

                    <v-list-item to="/register" @click="drawer = false">
                        <template v-slot:prepend>
                            <v-icon>mdi-account-plus</v-icon>
                        </template>
                        <v-list-item-title>Register</v-list-item-title>
                    </v-list-item>
                </template>
            </v-list>
        </v-navigation-drawer>
    </v-app-bar>
</template>

<script>
import { useAuthStore } from '@/stores';

export default {
    name: 'NavBar',
    data() {
        return {
            drawer: false,
        }
    },
    computed: {
        authStore() {
            return useAuthStore();
        },
        isAuthenticated() {
            return this.authStore.isAuthenticated;
        },
        currentUser() {
            return this.authStore.currentUser;
        }
    },
    methods: {
        async handleLogout() {
            await this.authStore.logout();
            this.$router.push('/login');
        },
        async handleLogoutAndCloseDrawer() {
            this.drawer = false;
            await this.handleLogout();
        }
    }
};
</script>
