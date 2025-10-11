<template>
    <v-container class="login-page fill-height" fluid>
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" lg="4">
                <v-card class="login-container elevation-3">
                    <v-card-title class="text-center">Login</v-card-title>
                    <v-card-text>
                        <v-form class="auth-form" @submit.prevent="handleSubmit">
                            <v-text-field
                                id="email"
                                v-model="email"
                                label="Email"
                                type="email"
                                variant="outlined"
                                required
                                autocomplete="username"
                            ></v-text-field>

                            <v-text-field
                                id="password"
                                v-model="password"
                                label="Password"
                                type="password"
                                variant="outlined"
                                required
                                autocomplete="current-password"
                            ></v-text-field>

                            <v-btn type="submit" color="primary" block :loading="authLoading" class="mt-4">
                                {{ authLoading ? 'Logging in...' : 'Login' }}
                            </v-btn>

                            <v-alert v-if="authError" type="error" class="mt-4" density="compact">
                                {{ authError }}
                            </v-alert>

                            <div class="text-center mt-4">
                                Don't have an account?
                                <v-btn variant="text" color="primary" to="/register" class="ps-1" density="compact">
                                    Register
                                </v-btn>
                            </div>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { useAuthStore } from '@/store'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()

// Extract reactive state from stores
const { loading: authLoading, error: authError, isAuthenticated } = storeToRefs(authStore)

// Local reactive state
const email = ref('')
const password = ref('')

// Methods
const handleSubmit = async () => {
    try {
        // Attempt login
        await authStore.login({
            email: email.value,
            password: password.value,
        })

        // If successfully authenticated, redirect to saved path or home page
        if (isAuthenticated.value) {
            // Check for a saved redirect path
            const redirectPath = localStorage.getItem('redirectPath')
            if (redirectPath) {
                // Clear the saved path before redirecting
                localStorage.removeItem('redirectPath')
                router.push(redirectPath)
            } else {
                router.push('/')
            }
        }
    } catch (error) {
        logger.error('Login failed', error, 'LoginForm')
    }
}
</script>

<style scoped>
.login-page {
    background-color: var(--gray-light);
}

.auth-form {
    width: 100%;
}
</style>
