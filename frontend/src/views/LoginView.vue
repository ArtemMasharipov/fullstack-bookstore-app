<template>
    <div class="login">
        <login-form />
    </div>
</template>

<script>
import LoginForm from '@/components/auth/LoginForm.vue'

export default {
    name: 'LoginView',
    components: {
        LoginForm,
    },
}
</script>

<style scoped>
.login {
    padding: 2rem;
    max-width: 400px;
    margin: 0 auto;
}
.login h1 {
    color: #333;
}
</style>
