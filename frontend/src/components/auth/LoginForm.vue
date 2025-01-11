<template>
    <div class="login-page">
        <div class="login-container">
            <h2>Login</h2>
            <form class="auth-form" @submit.prevent="handleSubmit">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input id="email" v-model="email" type="email" required autocomplete="username" />
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input id="password" v-model="password" type="password" required autocomplete="current-password" />
                </div>

                <button type="submit" class="btn btn-primary" :disabled="authLoading">
                    {{ authLoading ? 'Logging in...' : 'Login' }}
                </button>

                <p v-if="authError" class="error-message">{{ authError }}</p>
                <p class="register-link">
                    Don't have an account?
                    <router-link to="/register">Register</router-link>
                </p>
            </form>
        </div>
    </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
    name: 'LoginForm',
    data() {
        return {
            email: '',
            password: '',
        };
    },
    computed: {
        ...mapGetters('auth', ['authError', 'authLoading', 'currentUser', 'isAuthenticated']),
    },
    methods: {
        ...mapActions('auth', ['login']),
        async handleSubmit() {
            try {
                const user = await this.login({ email: this.email, password: this.password });
                if (this.isAuthenticated) {
                    console.log('User logged in:', user); // Вывод объекта пользователя в консоль
                    this.$router.push('/');
                }
            } catch (error) {
                console.error('Login error:', error.response ? error.response.data : error.message);
            }
        },
    },
};
</script>

<style scoped>
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: var(--gray-light);
}

.login-container {
    width: 100%;
    max-width: 400px;
    padding: 2rem;
    background: var(--white);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

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
    color: var(--error-color);
    margin-top: 1rem;
}

.register-link {
    text-align: center;
    margin-top: 1rem;

    a {
        color: var(--primary-color);
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }
}
</style>
