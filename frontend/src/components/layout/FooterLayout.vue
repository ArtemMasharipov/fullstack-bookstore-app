<template>
  <footer class="footer">
    <div class="container">
      <p>&copy; {{ new Date().getFullYear() }} Bookstore. All rights reserved.</p>
      <nav>
        <router-link to="/about">About Us</router-link> |
        <router-link to="/contact">Contact</router-link> |
        <router-link to="/privacy">Privacy Policy</router-link>
      </nav>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterLayout',
};
</script>

<style scoped>
.footer {
  background-color: var(--primary-color);
  color: var(--white);
  padding: 1rem 0;
  text-align: center;
}

.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

nav {
  margin-top: 0.5rem;
}

nav a {
  color: var(--white);
  margin: 0 0.5rem;
  text-decoration: none;
}

nav a:hover {
  text-decoration: underline;
}
</style>