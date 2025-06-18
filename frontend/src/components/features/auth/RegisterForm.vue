<template>
    <v-form class="auth-form" @submit.prevent="handleSubmit">
        <v-text-field id="username" v-model="username" label="Username" variant="outlined" required></v-text-field>

        <v-text-field id="email" v-model="email" label="Email" variant="outlined" type="email" required></v-text-field>

        <v-text-field
            id="password"
            v-model="password"
            label="Password"
            variant="outlined"
            type="password"
            required
        ></v-text-field>

        <v-text-field
            id="confirmPassword"
            v-model="confirmPassword"
            label="Confirm Password"
            variant="outlined"
            type="password"
            required
        ></v-text-field>

        <v-btn type="submit" color="primary" block :loading="authLoading" class="mt-4">
            {{ authLoading ? 'Creating Account...' : 'Register' }}
        </v-btn>

        <v-alert v-if="authError" type="error" class="mt-4">
            {{ authError }}
        </v-alert>
    </v-form>
</template>

<script setup>
import { useAuthStore, useAuthUiStore } from '@/store'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// Router
const router = useRouter()

// Stores
const authStore = useAuthStore()
const authUiStore = useAuthUiStore()

// Extract reactive state from stores
const { loading: authLoading, error: authError } = storeToRefs(authStore)

// Local reactive state
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

// Methods
const handleSubmit = async () => {
    // Clear any previous errors
    authUiStore.clearError()

    const success = await authUiStore.handleRegister({
        username: username.value,
        email: email.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
    })

    if (success) {
        router.push('/')
    }
}
</script>

<style scoped>
.auth-form {
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
}
</style>
