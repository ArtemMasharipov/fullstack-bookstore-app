<template>
  <div class="authors">
    <author-list />
  </div>
</template>

<script>
import AuthorList from '@/components/authors/AuthorList.vue';

export default {
  name: 'AuthorsView',
  components: {
    AuthorList,
  },
};
</script>

<style scoped>
.authors {
  padding: 2rem;
}
</style>