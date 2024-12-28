<template>
  <div class="book-details">
    <book-details :book-id="$route.params.id" />
  </div>
</template>

<script>
import BookDetails from '@/components/books/BookDetails.vue';

export default {
  name: 'BookDetailsView',
  components: {
    BookDetails,
  },
};
</script>

<style scoped>
.book-details {
  padding: 2rem;
}
.book-details h1, .book-details h2 {
  color: #333;
}
.book-details p {
  color: #666;
}
.book-details button {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  cursor: pointer;
}
.book-details button:hover {
  background-color: #369f6b;
}
</style>