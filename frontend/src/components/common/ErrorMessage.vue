<template>
    <div v-if="message" class="error-message">
        {{ message }}
    </div>
</template>

<script>
export default {
    name: 'ErrorMessage',
    props: {
        message: {
            type: String,
            required: true
        }
    }
}
</script>

<style scoped>
.error-message {
    color: var(--error-color);
    padding: 0.5rem;
    margin: 0.5rem 0;
    border-radius: 4px;
    background-color: rgba(220, 53, 69, 0.1);
}
</style>