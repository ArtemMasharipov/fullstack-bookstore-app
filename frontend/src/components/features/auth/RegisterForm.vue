<template>
    <v-form ref="formRef" class="auth-form" @submit.prevent="handleSubmit">
        <v-text-field
            id="username"
            v-model="username"
            label="Username"
            required
            prepend-inner-icon="mdi-account-outline"
            :rules="[(v) => !!v || 'Username is required']"
        />

        <v-text-field
            id="email"
            v-model="email"
            label="Email"
            type="email"
            required
            prepend-inner-icon="mdi-email-outline"
            :rules="[(v) => !!v || 'Email is required']"
        />

        <v-text-field
            id="password"
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            required
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :rules="[(v) => !!v || 'Password is required', (v) => v.length >= 6 || 'At least 6 characters']"
            @click:append-inner="showPassword = !showPassword"
        />

        <v-text-field
            id="confirmPassword"
            v-model="confirmPassword"
            label="Confirm Password"
            :type="showPassword ? 'text' : 'password'"
            required
            prepend-inner-icon="mdi-lock-check-outline"
            :rules="[(v) => !!v || 'Please confirm your password', (v) => v === password || 'Passwords do not match']"
        />

        <v-btn type="submit" color="primary" block :loading="authLoading" size="large" class="mt-2">
            {{ authLoading ? 'Creating Account...' : 'Create Account' }}
        </v-btn>

        <v-alert v-if="authError" type="error" class="mt-4" density="compact">
            {{ authError }}
        </v-alert>
    </v-form>
</template>

<script setup>
import { useAuthStore } from '@/stores'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const { loading: authLoading, error: authError } = storeToRefs(authStore)

const formRef = ref(null)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    try {
        await authStore.register({
            username: username.value,
            email: email.value,
            password: password.value,
            confirmPassword: confirmPassword.value,
        })
        router.push('/')
    } catch (error) {
        logger.error('Registration failed', error, 'RegisterForm')
    }
}
</script>
