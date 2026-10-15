<template>
    <v-container class="fill-height">
        <v-row justify="center" align="center">
            <v-col cols="12" sm="8" md="6" class="text-center">
                <v-icon icon="mdi-book-off-outline" size="80" color="primary" class="mb-4" />
                <h1 class="text-h2 font-weight-bold mb-2">404</h1>
                <h2 class="text-h5 text-medium-emphasis mb-4">{{ t('errors.notFoundTitle') }}</h2>
                <p class="text-body-1 text-medium-emphasis mb-8">
                    {{ t('errors.notFoundDescription') }}
                </p>
                <div class="d-flex justify-center ga-3">
                    <v-btn color="primary" :to="localeRoute('Home')" prepend-icon="mdi-home-outline">
                        {{ t('errors.home') }}
                    </v-btn>
                    <v-btn variant="outlined" prepend-icon="mdi-arrow-left" @click="goBack">
                        {{ t('errors.back') }}
                    </v-btn>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { localeRoute } from '@/router/locale'
import { useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const goBack = () => router.go(-1)
</script>
