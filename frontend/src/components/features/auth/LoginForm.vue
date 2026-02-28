<template>
    <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
            <!-- Branding side (desktop only) -->
            <v-col cols="12" md="5" class="d-none d-md-flex flex-column align-center justify-center">
                <v-icon icon="mdi-book-open-page-variant" size="80" color="primary" class="mb-4" />
                <h2 class="text-h4 font-weight-bold text-center mb-2">Welcome Back</h2>
                <p class="text-body-1 text-medium-emphasis text-center">
                    Sign in to access your orders, wishlist, and personalized recommendations.
                </p>
            </v-col>

            <v-divider vertical class="d-none d-md-block mx-6" />

            <!-- Form side -->
            <v-col cols="12" sm="8" md="5" lg="4">
                <v-card class="pa-2" elevation="0" color="transparent">
                    <v-card-title class="text-h5 font-weight-bold text-center d-md-none mb-2">Login</v-card-title>
                    <v-card-text>
                        <v-form ref="formRef" class="auth-form" @submit.prevent="handleSubmit">
                            <v-text-field
                                id="email"
                                v-model="email"
                                label="Email"
                                type="email"
                                required
                                autocomplete="username"
                                prepend-inner-icon="mdi-email-outline"
                                :rules="[(v) => !!v || 'Email is required']"
                            />

                            <v-text-field
                                id="password"
                                v-model="password"
                                label="Password"
                                :type="showPassword ? 'text' : 'password'"
                                required
                                autocomplete="current-password"
                                prepend-inner-icon="mdi-lock-outline"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                :rules="[(v) => !!v || 'Password is required']"
                                @click:append-inner="showPassword = !showPassword"
                            />

                            <v-btn type="submit" color="primary" block :loading="authLoading" size="large" class="mt-2">
                                {{ authLoading ? 'Logging in...' : 'Login' }}
                            </v-btn>

                            <v-alert v-if="authError" type="error" class="mt-4" density="compact">
                                {{ authError }}
                            </v-alert>

                            <div class="text-center mt-6">
                                <span class="text-medium-emphasis">Don't have an account?</span>
                                <v-btn variant="text" color="primary" to="/register" density="compact">
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
import { useAuthStore } from '@/stores'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const { loading: authLoading, error: authError, isAuthenticated } = storeToRefs(authStore)

const formRef = ref(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    try {
        await authStore.login({
            email: email.value,
            password: password.value,
        })

        if (isAuthenticated.value) {
            const redirectPath = localStorage.getItem('redirectPath')
            if (redirectPath) {
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
