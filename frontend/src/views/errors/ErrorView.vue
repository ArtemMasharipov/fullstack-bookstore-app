<template>
    <v-container class="fill-height">
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" class="text-center">
                <v-icon icon="mdi-alert-circle-outline" size="80" color="error" class="mb-4" />
                <h1 class="text-h2 font-weight-bold mb-2">{{ t('errors.oops') }}</h1>
                <h2 class="text-h5 text-medium-emphasis mb-4">{{ t('errors.title') }}</h2>
                <p class="text-body-1 text-medium-emphasis mb-6">
                    {{ t('errors.UNKNOWN') }}
                </p>

                <v-expand-transition>
                    <v-alert
                        v-if="errorMessage"
                        type="error"
                        variant="tonal"
                        class="text-left mb-6"
                        closable
                        density="compact"
                    >
                        <pre class="text-caption" style="white-space: pre-wrap; word-break: break-word">{{
                            errorMessage
                        }}</pre>
                    </v-alert>
                </v-expand-transition>

                <div class="d-flex justify-center ga-3">
                    <v-btn color="primary" :to="localeRoute('Home')" prepend-icon="mdi-home-outline">
                        {{ t('errors.home') }}
                    </v-btn>
                    <v-btn variant="outlined" prepend-icon="mdi-refresh" @click="reloadPage">
                        {{ t('errors.reload') }}
                    </v-btn>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { localeRoute } from '@/router/locale'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveErrorKey } from '@/utils/errorResolver'
import { useRoute } from 'vue-router'

const { t } = useI18n()

const route = useRoute()
const errorMessage = computed(() => t(resolveErrorKey({ code: route.query.code })))

const reloadPage = () => {
    window.location.reload()
}
</script>
