<template>
    <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
            <!-- Branding side (desktop only) -->
            <v-col cols="12" md="5" class="d-none d-md-flex flex-column align-center justify-center">
                <v-icon icon="mdi-book-open-page-variant" size="80" color="primary" class="mb-4" />
                <h2 class="text-h4 font-weight-bold text-center mb-2">{{ t('auth.login.welcome') }}</h2>
                <p class="text-body-1 text-medium-emphasis text-center">{{ t('auth.login.intro') }}</p>
            </v-col>

            <v-divider vertical class="d-none d-md-block mx-6" />

            <!-- Form side -->
            <v-col cols="12" sm="8" md="5" lg="4">
                <v-card class="pa-2" elevation="0" color="transparent">
                    <h1 class="text-h5 font-weight-bold text-center mb-2">{{ t('auth.login.title') }}</h1>
                    <v-card-text>
                        <v-form ref="formRef" class="auth-form" @submit.prevent="handleSubmit">
                            <v-text-field
                                id="email"
                                v-model="email"
                                :label="t('auth.fields.email')"
                                :aria-label="t('auth.fields.email')"
                                type="email"
                                required
                                autocomplete="username"
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
                                autocomplete="current-password"
                                prepend-inner-icon="mdi-lock-outline"
                                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                                :rules="[(v) => !!v || t('auth.rules.passwordRequired')]"
                                @click:append-inner="showPassword = !showPassword"
                            />

                            <v-btn type="submit" color="primary" block :loading="authLoading" size="large" class="mt-2">
                                {{ t('auth.login.submit') }}
                            </v-btn>

                            <v-alert v-if="errorKey" type="error" class="mt-4" density="compact">
                                {{ t(errorKey, errorParams) }}
                            </v-alert>

                            <div class="text-center mt-6">
                                <span class="text-medium-emphasis">{{ t('auth.login.noAccount') }}</span>
                                <v-btn variant="text" color="primary" :to="registerRoute" density="compact">
                                    {{ t('auth.login.register') }}
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
import { localeRoute } from '@/router/locale'
import { afterSignIn } from '@/router/redirect'
import { useAuthStore } from '@/stores'
import { resolveErrorKey } from '@/utils/errorResolver'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const { loading: authLoading, isAuthenticated } = storeToRefs(authStore)

const formRef = ref(null)
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorKey = ref(null)
const errorParams = ref({})

// Registration returns to the same page; the form that signs in checks the path
const registerRoute = computed(() =>
    localeRoute('Register', route.query.redirect ? { query: { redirect: route.query.redirect } } : {})
)

const handleSubmit = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    errorKey.value = null
    try {
        await authStore.login({
            email: email.value,
            password: password.value,
        })

        if (isAuthenticated.value) await afterSignIn(router, route)
    } catch (error) {
        errorParams.value = {}
        if (error.status === 429) {
            // Too many failed attempts from this device: the server says when to try again
            errorKey.value = 'auth.tooManyAttempts'
            errorParams.value = { minutes: Math.ceil((error.details?.retryAfter ?? 60) / 60) }
        } else {
            // On this form a 401 means the email or the password, not an ended session
            errorKey.value = error.status === 401 ? 'auth.login.invalidCredentials' : resolveErrorKey(error)
        }
        logger.error('Login failed', error, 'LoginForm')
    }
}
</script>
