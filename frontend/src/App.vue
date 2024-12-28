<template>
  <div id="app">
    <header>
      <nav-bar />
    </header>
    <main>
      <router-view />
    </main>
    <footer>
      <footer-layout />
    </footer>
  </div>
</template>

<script>
import NavBar from '@/components/layout/NavBar.vue';
import FooterLayout from '@/components/layout/FooterLayout.vue';

export default {
  name: 'App',
  components: {
    NavBar,
    FooterLayout,
  },
  created() {
    if (this.$store.getters['auth/isAuthenticated']) {
      this.$store.dispatch('auth/fetchCurrentUser');
    }
  },
};
</script>

<style>
@import '@/styles/common.css';

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--secondary-color);
}

main {
  flex: 1;
  padding: 1rem;
}
</style>