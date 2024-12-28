<template>
    <div class="author-details">
        <author-details :author-id="$route.params.id" />
    </div>
</template>

<script>
import AuthorDetails from '@/components/authors/AuthorDetails.vue';

export default {
    name: 'AuthorDetailsView',
    components: {
        AuthorDetails,
    },
};
</script>

<style scoped>
.author-details {
    padding: 2rem;
}
.author-details h1,
.author-details h2 {
    color: #333;
}
.author-details p,
.author-details ul {
    color: #666;
}
.author-details ul {
    list-style-type: none;
    padding: 0;
}
.author-details ul li {
    margin: 0.5rem 0;
}
</style>
