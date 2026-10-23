<template>
    <v-form class="auth-form" @submit.prevent="handleSubmit">
        <v-alert v-if="errorKey" ref="summaryAlert" type="error" class="mb-4" density="compact" tabindex="-1">
            {{ t(errorKey, errorParams) }}
        </v-alert>
        <v-text-field
            id="username"
            v-model="username"
            :label="t('auth.fields.username')"
            required
            autocomplete="username"
            prepend-inner-icon="mdi-account-outline"
            :disabled="busy"
            :error-messages="errors.username"
            :aria-invalid="errors.username ? 'true' : undefined"
        />
        <v-text-field
            id="email"
            v-model="email"
            :label="t('auth.fields.email')"
            type="email"
            required
            autocomplete="email"
            prepend-inner-icon="mdi-email-outline"
            :disabled="busy"
            :error-messages="errors.email"
            :aria-invalid="errors.email ? 'true' : undefined"
        />
        <v-text-field
            id="password"
            v-model="password"
            :label="t('auth.fields.password')"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock-outline"
            :hint="t('profile.passwordHint')"
            persistent-hint
            :disabled="busy"
            :error-messages="errors.password"
            :aria-invalid="errors.password ? 'true' : undefined"
        >
            <template #append-inner>
                <v-btn
                    type="button"
                    variant="text"
                    size="small"
                    :icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    :aria-label="t(showPassword ? 'profile.hidePassword' : 'profile.showPassword')"
                    :aria-pressed="showPassword"
                    :disabled="busy"
                    @click="showPassword = !showPassword"
                />
            </template>
        </v-text-field>
        <v-text-field
            id="confirmPassword"
            v-model="confirmPassword"
            :label="t('auth.fields.confirmPassword')"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="new-password"
            prepend-inner-icon="mdi-lock-check-outline"
            :disabled="busy"
            :error-messages="errors.confirmPassword"
            :aria-invalid="errors.confirmPassword ? 'true' : undefined"
        />
        <v-btn type="submit" color="primary" block :loading="pending" :disabled="busy" size="large" class="mt-2">
            {{ t('auth.register.submit') }}
        </v-btn>
    </v-form>
</template>

<script setup>
import { afterSignIn } from '@/router/redirect'
import { useAuthStore } from '@/stores'
import { resolveErrorKey } from '@/utils/errorResolver'
import { passwordErrorKey, passwordLengthIssue } from '@/utils/passwordRules'
import { computed, nextTick, onScopeDispose, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const pending = ref(false)
const busy = computed(() => pending.value || authStore.loading)
const errors = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const errorKey = ref(null)
const errorParams = ref({})
const summaryAlert = ref(null)
let disposed = false
onScopeDispose(() => {
    disposed = true
})
async function showSummary(key, params = {}) {
    if (disposed) return
    errorKey.value = key
    errorParams.value = params
    await nextTick()
    if (!disposed) summaryAlert.value?.$el?.focus()
}
async function handleSubmit() {
    if (busy.value) return
    errors.username = username.value ? '' : t('auth.rules.usernameRequired')
    errors.email = email.value ? '' : t('auth.rules.emailRequired')
    const issue = passwordLengthIssue(password.value)
    errors.password = issue ? t(passwordErrorKey(issue)) : ''
    errors.confirmPassword = !confirmPassword.value
        ? t('auth.rules.confirmRequired')
        : confirmPassword.value !== password.value
        ? t('auth.rules.passwordsDiffer')
        : ''
    if (Object.values(errors).some(Boolean)) return showSummary('profile.summary')
    pending.value = true
    errorKey.value = null
    try {
        await authStore.register({ username: username.value, email: email.value, password: password.value })
        if (!disposed) await afterSignIn(router, route)
    } catch (error) {
        if (disposed) return
        if (error.fields) {
            for (const [field, code] of Object.entries(error.fields)) {
                if (field === 'password') errors.password = t(passwordErrorKey(code))
                else if (field === 'username') errors.username = t('profile.usernameError')
                else if (field === 'email') errors.email = t('admin.userForm.emailError')
            }
            await showSummary('profile.summary')
        } else if (error.status === 429) {
            await showSummary('auth.tooManyAttempts', { minutes: Math.ceil((error.details?.retryAfter ?? 60) / 60) })
        } else await showSummary(error.code === 'CONFLICT' ? 'auth.register.taken' : resolveErrorKey(error))
    } finally {
        if (!disposed) pending.value = false
    }
}
</script>
