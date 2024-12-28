<template>
  <div class="book-list">
    <book-list />
  </div>
</template>

<script>
import BookList from '@/components/books/BookList.vue';

export default {
  name: 'BooksView',
  components: {
    BookList,
  },
};
</script>

<style scoped>
.book-list {
  padding: 2rem;
}
</style>