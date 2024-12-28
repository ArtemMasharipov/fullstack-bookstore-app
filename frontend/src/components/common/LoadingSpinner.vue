<template>
    <div class="loading-spinner">
        <div class="spinner"></div>
    </div>
</template>

<script>
export default {
    name: 'LoadingSpinner'
}
</script>

<style scoped>
.loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid var(--gray-light);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>