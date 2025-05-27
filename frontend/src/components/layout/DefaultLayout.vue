<template>
    <v-app>
        <nav-bar />
        
        <v-main>
            <v-container fluid>
                <router-view />
            </v-container>
        </v-main>
        
        <footer-layout />
        
        <!-- Global Dialog System -->
        <dialog-ui />
    </v-app>
</template>

<script setup>
// Components
import DialogUI from '@/components/layout/DialogUI.vue';
import FooterLayout from '@/components/layout/FooterLayout.vue';
import NavBar from '@/components/layout/NavBar.vue';
</script>
