<template>
  <v-app>
    <nav-bar />
    
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
    
    <footer-layout />
      
    <!-- Legacy GlobalUI (will be deprecated) -->
    <GlobalUI />
    
    <!-- Dialog system (separate from notifications for SOLID principles) -->
    <DialogUI />
  </v-app>
</template>

<script>
import FooterLayout from '@/components/layout/FooterLayout.vue';
import GlobalUI from '@/components/layout/GlobalUI.vue';
import DialogUI from '@/components/layout/DialogUI.vue';
import NavBar from '@/components/layout/NavBar.vue';
import { useAuthStore } from '@/stores';

export default {
  name: 'App',
  components: {
    NavBar,
    FooterLayout,
    GlobalUI,
    DialogUI
  },
  computed: {
    authStore() {
      return useAuthStore();
    }
  },
  created() {
    // Восстанавливаем данные пользователя из токена при загрузке приложения
    this.authStore.restoreUserFromToken();
  }
};
</script>

<style>
/* Базовые стили для интеграции с Vuetify */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.v-application {
  font-family: "Roboto", sans-serif;
}

/* Импортируем общие стили, но только те, которые не конфликтуют с Vuetify */
@import '@/styles/common-variables.css';
</style>