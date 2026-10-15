<template>
    <div class="order-quote">
        <div class="d-flex justify-space-between ga-2 mb-2">
            <span class="text-medium-emphasis">{{ t('cart.subtotal') }}</span>
            <span>{{ money(quote.itemsTotal) }}</span>
        </div>
        <div class="d-flex justify-space-between ga-2 mb-2">
            <span class="text-medium-emphasis">{{ t('cart.shipping') }}</span>
            <span>{{ quote.shipping === 0 ? t('cart.shippingFree') : money(quote.shipping) }}</span>
        </div>
        <div v-if="!quote.vatIncluded" class="d-flex justify-space-between ga-2 mb-2">
            <span class="text-medium-emphasis">{{ t('orders.tax') }}</span>
            <span>{{ money(quote.vatAmount) }}</span>
        </div>
        <v-divider class="my-3" />
        <div class="d-flex justify-space-between ga-2">
            <span class="text-subtitle-1 font-weight-bold">{{ t('cart.total') }}</span>
            <span class="text-subtitle-1 font-weight-bold">{{ money(quote.total) }}</span>
        </div>
        <p v-if="quote.vatIncluded" class="text-caption text-medium-emphasis mb-0">
            {{ t('cart.vatIncluded', { amount: money(quote.vatAmount) }) }}
        </p>
    </div>
</template>

<script setup>
import { formatMoney } from '@/utils'
import { useI18n } from 'vue-i18n'

const props = defineProps({
    /**
     * A server quote in geller: { currency, itemsTotal, shipping, vatIncluded, vatAmount, total }.
     * Older orders added their tax on top (vatIncluded: false); it is then a line of the total.
     */
    quote: {
        type: Object,
        required: true,
    },
})

const { t } = useI18n()
const money = (amount) => formatMoney(amount, props.quote.currency)
</script>
