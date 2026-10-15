<template>
    <v-container class="py-6">
        <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-6">
            <h1 class="text-h4 font-weight-bold">{{ t('checkout.title') }}</h1>
            <v-btn variant="text" :to="localeRoute('Cart')" prepend-icon="mdi-arrow-left">
                {{ t('checkout.backToCart') }}
            </v-btn>
        </div>

        <v-row v-if="cart.status === 'idle' || cart.status === 'loading'">
            <v-col cols="12" md="7">
                <v-skeleton-loader type="heading, text, text, text, text, button" />
            </v-col>
            <v-col cols="12" md="5">
                <v-skeleton-loader type="article" />
            </v-col>
        </v-row>

        <error-message
            v-else-if="cart.status === 'error'"
            :code="cartErrorCode"
            :on-retry="cart.load"
            :closable="false"
        />

        <v-alert v-else-if="cart.isEmpty && !placing" type="info" variant="tonal" icon="mdi-cart-off">
            {{ t('checkout.empty') }}
            <div class="mt-2">
                <v-btn variant="text" :to="localeRoute('Books')" prepend-icon="mdi-book-open-page-variant-outline">
                    {{ t('cart.browse') }}
                </v-btn>
            </div>
        </v-alert>

        <v-row v-else>
            <v-col cols="12" md="7">
                <v-alert v-if="cart.hasUnavailable" type="warning" variant="tonal" class="mb-4">
                    {{ t('errors.CART_HAS_UNAVAILABLE_ITEMS') }}
                    <div class="mt-2">
                        <v-btn variant="text" :to="localeRoute('Cart')" prepend-icon="mdi-cart">
                            {{ t('checkout.goToCart') }}
                        </v-btn>
                    </div>
                </v-alert>

                <v-alert v-if="checkout.error === 'NETWORK_ERROR'" type="error" variant="tonal" class="mb-4">
                    {{ t('checkout.networkError') }}
                    <div class="mt-2">
                        <v-btn variant="text" prepend-icon="mdi-refresh" @click="retry">{{ t('errors.retry') }}</v-btn>
                    </div>
                </v-alert>
                <error-message v-else-if="otherError" :code="checkout.error" :closable="false" class="mb-4" />

                <v-card>
                    <v-card-title class="text-h6">{{ t('checkout.addressTitle') }}</v-card-title>
                    <v-card-text>
                        <checkout-form
                            :fields="checkout.fields"
                            :submitting="checkout.status === 'submitting'"
                            :blocked="cart.hasUnavailable"
                            @submit="place"
                        />
                    </v-card-text>
                </v-card>
            </v-col>

            <v-col cols="12" md="5">
                <v-card variant="outlined" class="checkout-summary">
                    <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('checkout.itemsTitle') }}</v-card-title>
                    <v-card-text>
                        <ul class="checkout-lines mb-3">
                            <li
                                v-for="line in cart.lines"
                                :key="line.bookId"
                                class="d-flex justify-space-between ga-2 mb-2"
                            >
                                <span>
                                    <span class="d-block">{{ line.title ?? t('cart.unavailable.DELETED') }}</span>
                                    <span class="text-caption text-medium-emphasis">
                                        {{
                                            t('checkout.lineQuantity', {
                                                quantity: line.quantity,
                                                price: formatMoney(line.unitPrice),
                                            })
                                        }}
                                    </span>
                                </span>
                                <span class="text-no-wrap">{{ formatMoney(line.lineTotal) }}</span>
                            </li>
                        </ul>
                        <order-quote v-if="cart.quote" :quote="cart.quote" />
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>

        <v-dialog :model-value="!!checkout.priceChange" max-width="480" persistent>
            <v-card v-if="checkout.priceChange">
                <v-card-title class="text-h6 text-wrap">{{ t('checkout.priceChanged.title') }}</v-card-title>
                <v-card-text>
                    {{ t('checkout.priceChanged.text', { total: formatMoney(checkout.priceChange.total) }) }}
                </v-card-text>
                <v-card-actions class="flex-wrap">
                    <v-spacer />
                    <v-btn variant="text" @click="checkout.priceChange = null">
                        {{ t('checkout.priceChanged.cancel') }}
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="flat"
                        :loading="checkout.status === 'submitting'"
                        @click="confirmPrice"
                    >
                        {{ t('checkout.priceChanged.confirm') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-container>
</template>

<script setup>
import CheckoutForm from '@/components/features/checkout/CheckoutForm.vue'
import OrderQuote from '@/components/features/orders/OrderQuote.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { localeRoute } from '@/router/locale'
import { useCartStore, useCheckoutStore } from '@/stores'
import { formatMoney } from '@/utils'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const cart = useCartStore()
const checkout = useCheckoutStore()

// The last request, so a retry after a lost connection sends exactly the same
const lastRequest = ref(null)
// An order is being placed: the cart empties before the order page opens
const placing = ref(false)

const cartErrorCode = computed(() => cart.error?.replace(/^errors\./, ''))
const HANDLED = ['NETWORK_ERROR', 'PRICE_CHANGED', 'VALIDATION_FAILED', 'CART_HAS_UNAVAILABLE_ITEMS']
const otherError = computed(() => checkout.error && !HANDLED.includes(checkout.error))

async function follow(order) {
    if (order) {
        await router.push(localeRoute('OrderDetails', { params: { id: order.id } }))
        return
    }
    placing.value = false
    if (checkout.error === 'CART_HAS_UNAVAILABLE_ITEMS') {
        await router.push(localeRoute('Cart'))
    } else if (checkout.error === 'CART_EMPTY') {
        await cart.load()
    }
}

async function send(address, total) {
    lastRequest.value = { address, total }
    placing.value = true
    await follow(await checkout.submit(address, total))
}

const place = (address) => send(address, cart.quote.total)
const retry = () => send(lastRequest.value.address, lastRequest.value.total)

async function confirmPrice() {
    const { address } = lastRequest.value
    lastRequest.value = { address, total: checkout.priceChange.total }
    placing.value = true
    await follow(await checkout.confirmPriceChange(address))
}

// Each visit is a new checkout with its own idempotency key; the cart is
// reloaded because prices may have changed
onMounted(() => {
    checkout.start()
    cart.load()
})
</script>

<style scoped>
.checkout-lines {
    list-style: none;
    padding: 0;
    overflow-wrap: anywhere;
}

@media (min-width: 960px) {
    .checkout-summary {
        position: sticky;
        top: 80px;
    }
}
</style>
