<template>
    <v-footer app color="primary">
        <span class="text-caption text-center w-100">
            © {{ currentYear }} Bookstore App. All rights reserved. · Built with Vue.js &amp; Vuetify
        </span>
    </v-footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>
