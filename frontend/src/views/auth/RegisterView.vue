<template>
    <v-container class="fill-height" fluid>
        <v-row justify="center" align="center">
            <!-- Branding side (desktop only) -->
            <v-col cols="12" md="5" class="d-none d-md-flex flex-column align-center justify-center">
                <v-icon icon="mdi-account-plus-outline" size="80" color="primary" class="mb-4" />
                <h2 class="text-h4 font-weight-bold text-center mb-2">{{ t('auth.register.welcome') }}</h2>
                <p class="text-body-1 text-medium-emphasis text-center">{{ t('auth.register.intro') }}</p>
            </v-col>

            <v-divider vertical class="d-none d-md-block mx-6" />

            <!-- Form side -->
            <v-col cols="12" sm="8" md="5" lg="4">
                <v-card class="pa-2" elevation="0" color="transparent">
                    <h1 class="text-h5 font-weight-bold text-center mb-2">{{ t('auth.register.title') }}</h1>
                    <v-card-text>
                        <register-form />
                        <div class="text-center mt-4">
                            <span class="text-medium-emphasis">{{ t('auth.register.haveAccount') }}</span>
                            <v-btn variant="text" color="primary" :to="loginLink" density="compact">
                                {{ t('auth.register.login') }}
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { loginRoute } from '@/router/redirect'
import RegisterForm from '@/components/features/auth/RegisterForm.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
// Signing in instead returns to the same page; the sign-in form checks the path
const loginLink = computed(() => loginRoute(route.query.redirect || undefined))
</script>
