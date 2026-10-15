<template>
    <v-container class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-6">
            <h1 class="text-h4 font-weight-bold">{{ t('cart.title') }}</h1>
            <v-btn variant="text" :to="localeRoute('Books')" prepend-icon="mdi-arrow-left">
                {{ t('cart.continueShopping') }}
            </v-btn>
        </div>
        <cart-list />
    </v-container>
</template>

<script setup>
import CartList from '@/components/features/cart/CartList.vue'
import { localeRoute } from '@/router/locale'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
