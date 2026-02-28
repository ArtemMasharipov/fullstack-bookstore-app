<template>
    <v-footer color="primary" class="py-8">
        <v-container>
            <v-row>
                <!-- Quick Links -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">Quick Links</h3>
                    <v-list density="compact" bg-color="transparent" class="pa-0">
                        <v-list-item to="/" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">Home</v-list-item-title>
                        </v-list-item>
                        <v-list-item to="/books" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">Books</v-list-item-title>
                        </v-list-item>
                        <v-list-item to="/authors" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">Authors</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-col>

                <!-- Customer Service -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">Customer Service</h3>
                    <v-list density="compact" bg-color="transparent" class="pa-0">
                        <v-list-item to="/orders" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">My Orders</v-list-item-title>
                        </v-list-item>
                        <v-list-item to="/cart" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">Shopping Cart</v-list-item-title>
                        </v-list-item>
                        <v-list-item to="/profile" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">My Account</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-col>

                <!-- About -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">About</h3>
                    <p class="text-body-2 text-white" style="opacity: 0.8">
                        Discover your next great read at Bookstore. We offer a curated collection of books across every
                        genre, with fast delivery and easy returns.
                    </p>
                </v-col>
            </v-row>

            <v-divider class="my-4" color="white" opacity="0.2" />

            <div class="text-caption text-center text-white" style="opacity: 0.7">
                &copy; {{ currentYear }} Bookstore App. All rights reserved.
            </div>
        </v-container>
    </v-footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
