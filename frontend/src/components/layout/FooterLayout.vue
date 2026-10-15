<template>
    <v-footer color="primary" class="py-8">
        <v-container>
            <v-row>
                <!-- Quick Links -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">{{ t('nav.quickLinks') }}</h3>
                    <v-list density="compact" bg-color="transparent" class="pa-0">
                        <v-list-item :to="localeRoute('Home')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('routes.Home') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item :to="localeRoute('Books')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('routes.Books') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item :to="localeRoute('Authors')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('routes.Authors') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-col>

                <!-- Customer Service -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">{{ t('nav.customerService') }}</h3>
                    <v-list density="compact" bg-color="transparent" class="pa-0">
                        <v-list-item :to="localeRoute('Orders')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('routes.Orders') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item :to="localeRoute('Cart')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('nav.cart') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item :to="localeRoute('Profile')" class="px-0 text-white" min-height="32">
                            <v-list-item-title class="text-body-2">{{ t('nav.account') }}</v-list-item-title>
                        </v-list-item>
                    </v-list>
                </v-col>

                <!-- About -->
                <v-col cols="12" sm="4">
                    <h3 class="text-subtitle-1 font-weight-bold text-white mb-3">{{ t('footer.about') }}</h3>
                    <p class="text-body-2 text-white" style="opacity: 0.8">
                        {{ t('footer.description') }}
                    </p>
                </v-col>
            </v-row>

            <v-divider class="my-4" color="white" opacity="0.2" />

            <div class="text-caption text-center text-white" style="opacity: 0.7">
                {{ t('footer.copyright', { year: currentYear }) }}
            </div>
        </v-container>
    </v-footer>
</template>

<script setup>
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
const currentYear = new Date().getFullYear()
</script>
