<template>
    <v-form ref="formRef" class="auth-form" @submit.prevent="handleSubmit">
        <v-text-field
            id="username"
            v-model="username"
            :label="t('auth.fields.username')"
            :aria-label="t('auth.fields.username')"
            required
            autocomplete="username"
            prepend-inner-icon="mdi-account-outline"
            :rules="[(v) => !!v || t('auth.rules.usernameRequired')]"
        />

        <v-text-field
            id="email"
            v-model="email"
            :label="t('auth.fields.email')"
            :aria-label="t('auth.fields.email')"
            type="email"
            required
            autocomplete="email"
            prepend-inner-icon="mdi-email-outline"
            :rules="[(v) => !!v || t('auth.rules.emailRequired')]"
        />

        <v-text-field
            id="password"
            v-model="password"
            :label="t('auth.fields.password')"
            :aria-label="t('auth.fields.password')"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            :rules="[
                (v) => !!v || t('auth.rules.passwordRequired'),
                (v) => v.length >= 6 || t('auth.rules.passwordTooShort'),
            ]"
            @click:append-inner="showPassword = !showPassword"
        />

        <v-text-field
            id="confirmPassword"
            v-model="confirmPassword"
            :label="t('auth.fields.confirmPassword')"
            :aria-label="t('auth.fields.confirmPassword')"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock-check-outline"
            :rules="[
                (v) => !!v || t('auth.rules.confirmRequired'),
                (v) => v === password || t('auth.rules.passwordsDiffer'),
            ]"
        />

        <v-btn type="submit" color="primary" block :loading="authLoading" size="large" class="mt-2">
            {{ t('auth.register.submit') }}
        </v-btn>

        <v-alert v-if="errorKey" type="error" class="mt-4" density="compact">
            {{ t(errorKey, errorParams) }}
        </v-alert>
    </v-form>
</template>

<script setup>
import { afterSignIn } from '@/router/redirect'
import { useAuthStore } from '@/stores'
import { resolveErrorKey } from '@/utils/errorResolver'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const { loading: authLoading } = storeToRefs(authStore)

const formRef = ref(null)
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const errorKey = ref(null)
const errorParams = ref({})

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    errorKey.value = null
    try {
        // The repeated password is checked here only; the server accepts the account fields alone
        await authStore.register({
            username: username.value,
            email: email.value,
            password: password.value,
        })
        await afterSignIn(router, route)
    } catch (error) {
        errorParams.value = {}
        if (error.status === 429) {
            // Too many failed attempts from this device: the server says when to try again
            errorKey.value = 'auth.tooManyAttempts'
            errorParams.value = { minutes: Math.ceil((error.details?.retryAfter ?? 60) / 60) }
        } else {
            // The server does not say which of the two is taken
            errorKey.value = error.code === 'CONFLICT' ? 'auth.register.taken' : resolveErrorKey(error)
        }
        logger.error('Registration failed', error, 'RegisterForm')
    }
}
</script>
