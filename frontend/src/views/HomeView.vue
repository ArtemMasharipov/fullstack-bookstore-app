<template>
  <div class="home">
    <h1>Welcome to Our Bookstore</h1>
    <p>Discover a wide range of books from various genres and authors. Enjoy a seamless shopping experience with us.</p>
    <router-link to="/books" class="btn">Browse Books</router-link>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
};
</script>

<style scoped>
.home {
  text-align: center;
  padding: 2rem;
}
.home h1 {
  color: #333;
}
.home p {
  color: #666;
}
.home .btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}
.home .btn:hover {
  background-color: #369f6b;
}
</style>