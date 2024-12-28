<template>
    <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
            <label for="username">Username</label>
            <input id="username" v-model="username" type="text" required />
        </div>

        <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" required />
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input id="password" v-model="password" type="password" required />
        </div>

        <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" v-model="confirmPassword" type="password" required />
        </div>

        <button type="submit" class="btn btn-primary" :disabled="authLoading">
            {{ authLoading ? 'Creating Account...' : 'Register' }}
        </button>

        <p v-if="authError" class="error-message">{{ authError }}</p>
    </form>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'RegisterForm',
    data() {
        return {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
        };
    },
    computed: {
        ...mapGetters('auth', ['authError', 'authLoading']),
    },
    methods: {
        ...mapActions('auth', ['register']),
        async handleSubmit() {
            try {
                await this.register({
                    username: this.username,
                    email: this.email,
                    password: this.password,
                    confirmPassword: this.confirmPassword,
                });
                this.$router.push('/');
            } catch (error) {
                console.error('Registration error:', error.response ? error.response.data : error.message);
            }
        },
    },
};
</script>

<style scoped>
.auth-form {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}

.btn {
    width: 100%;
    margin-top: 1rem;
}

.error-message {
    color: red;
    margin-top: 1rem;
}
</style>
