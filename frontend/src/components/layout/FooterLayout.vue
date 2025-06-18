<template>
    <v-footer app color="primary" class="white--text">
        <v-container>
            <v-row align="center" justify="center">
                <v-col cols="12" class="text-center">
                    <v-divider class="mb-4"></v-divider>
                    <p class="text-body-2 mb-2">© {{ currentYear }} Bookstore App. All rights reserved.</p>
                    <p class="text-caption">Built with Vue.js, Vuetify, and ❤️</p>
                </v-col>
            </v-row>
        </v-container>
    </v-footer>
</template>

<script setup>
import { computed } from 'vue'

/**
 * FooterLayout component - Application footer
 */

// Computed properties
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped>
.v-footer {
    margin-top: auto;
}
</style>
