<template>
  <v-container>
    <book-list />
  </v-container>
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