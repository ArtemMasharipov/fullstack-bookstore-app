<template>
    <v-card variant="outlined" class="cart-summary">
        <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('cart.summary') }}</v-card-title>
        <v-card-text>
            <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">{{ t('cart.subtotal') }}</span>
                <span>{{ formatMoney(quote.itemsTotal) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
                <span class="text-medium-emphasis">{{ t('cart.shipping') }}</span>
                <span>{{ quote.shipping === 0 ? t('cart.shippingFree') : formatMoney(quote.shipping) }}</span>
            </div>
            <p v-if="quote.shipping > 0" class="text-caption text-medium-emphasis mb-2">
                {{ t('cart.freeShippingFrom', { amount: formatMoney(quote.freeShippingThreshold) }) }}
            </p>
            <v-divider class="my-3" />
            <div class="d-flex justify-space-between">
                <span class="text-subtitle-1 font-weight-bold">{{ t('cart.total') }}</span>
                <span class="text-subtitle-1 font-weight-bold">{{ formatMoney(quote.total) }}</span>
            </div>
            <p class="text-caption text-medium-emphasis mb-4">
                {{ t('cart.vatIncluded', { amount: formatMoney(quote.vatAmount) }) }}
            </p>

            <v-btn
                v-if="isAuthenticated"
                color="primary"
                :to="localeRoute('Checkout')"
                block
                size="large"
                prepend-icon="mdi-cart-check"
            >
                {{ t('cart.checkout') }}
            </v-btn>
            <v-btn v-else color="primary" :to="signInToCheckout" block size="large" prepend-icon="mdi-login">
                {{ t('cart.loginToCheckout') }}
            </v-btn>
        </v-card-text>
    </v-card>
</template>

<script setup>
import { localeRoute } from '@/router/locale'
import { loginRoute } from '@/router/redirect'
import { useAuthStore } from '@/stores'
import { formatMoney } from '@/utils'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineProps({
    /** The server quote: { itemsTotal, shipping, vatAmount, total, freeShippingThreshold } in geller */
    quote: {
        type: Object,
        required: true,
    },
})

const { t } = useI18n()
const router = useRouter()
const { isAuthenticated } = storeToRefs(useAuthStore())
// A guest signs in first and then comes straight back to checkout
const signInToCheckout = computed(() => loginRoute(router.resolve(localeRoute('Checkout')).fullPath))
</script>

<style scoped>
@media (min-width: 960px) {
    .cart-summary {
        position: sticky;
        top: 80px;
    }
}
</style>
