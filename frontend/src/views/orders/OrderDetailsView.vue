<template>
    <v-container class="py-6">
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4" />

        <v-row v-if="orders.currentStatus === 'idle' || orders.currentStatus === 'loading'">
            <v-col cols="12" md="7">
                <v-skeleton-loader type="heading, list-item-two-line, list-item-two-line, paragraph" />
            </v-col>
            <v-col cols="12" md="5">
                <v-skeleton-loader type="article" />
            </v-col>
        </v-row>

        <v-alert
            v-else-if="orders.currentError === 'NOT_FOUND'"
            type="info"
            variant="tonal"
            icon="mdi-package-variant-remove"
        >
            {{ t('orders.notFound') }}
            <div class="mt-2">
                <v-btn variant="text" :to="localeRoute('Orders')" prepend-icon="mdi-arrow-left">
                    {{ t('orders.backToList') }}
                </v-btn>
            </div>
        </v-alert>

        <error-message
            v-else-if="orders.currentStatus === 'error'"
            :code="orders.currentError"
            :on-retry="load"
            :closable="false"
        />

        <template v-else-if="order">
            <div class="d-flex flex-wrap align-center ga-2 mb-6">
                <div class="mr-auto">
                    <h1 class="text-h4 font-weight-bold text-break">
                        {{ t('orders.number', { number: order.orderNumber }) }}
                    </h1>
                    <p class="text-medium-emphasis mb-0">
                        {{ t('orders.placedOn', { date: formatDate(order.createdAt) }) }}
                    </p>
                </div>
                <v-chip :color="STATUS_COLORS[order.status]" variant="tonal">
                    {{ t(`orders.status.${order.status}`) }}
                </v-chip>
                <v-chip variant="outlined">{{ t(`orders.payment.${order.paymentStatus}`) }}</v-chip>
                <v-btn
                    v-if="isCancellable(order)"
                    color="error"
                    variant="outlined"
                    prepend-icon="mdi-close-circle-outline"
                    @click="confirming = true"
                >
                    {{ t('orders.cancel') }}
                </v-btn>
            </div>

            <v-row>
                <v-col cols="12" md="7">
                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                            {{ t('orders.itemsTitle') }}
                        </v-card-title>
                        <v-card-text>
                            <ul class="order-lines">
                                <li
                                    v-for="item in order.items"
                                    :key="item.bookId"
                                    class="d-flex justify-space-between ga-2 mb-2"
                                >
                                    <span>
                                        <span class="d-block">{{ item.title }}</span>
                                        <span class="text-caption text-medium-emphasis">
                                            {{
                                                t('checkout.lineQuantity', {
                                                    quantity: item.quantity,
                                                    price: formatMoney(item.unitPrice, order.quote.currency),
                                                })
                                            }}
                                        </span>
                                    </span>
                                    <span class="text-no-wrap">
                                        {{ formatMoney(item.lineTotal, order.quote.currency) }}
                                    </span>
                                </li>
                            </ul>
                        </v-card-text>
                    </v-card>

                    <v-card variant="outlined" class="mb-4">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                            {{ t('orders.addressTitle') }}
                        </v-card-title>
                        <v-card-text>
                            <address class="order-address">
                                <span class="d-block">{{ order.shippingAddress.fullName }}</span>
                                <span class="d-block">{{ order.shippingAddress.line1 }}</span>
                                <span class="d-block">
                                    {{ `${order.shippingAddress.postalCode} ${order.shippingAddress.city}` }}
                                </span>
                                <span class="d-block">{{ order.shippingAddress.country }}</span>
                                <span v-if="order.shippingAddress.phone" class="d-block">
                                    {{ order.shippingAddress.phone }}
                                </span>
                            </address>
                        </v-card-text>
                    </v-card>

                    <v-card v-if="order.statusHistory.length" variant="outlined">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                            {{ t('orders.historyTitle') }}
                        </v-card-title>
                        <v-card-text>
                            <ol class="order-history">
                                <li v-for="(entry, index) in order.statusHistory" :key="index" class="mb-1">
                                    <span class="text-medium-emphasis">{{ formatDateTime(entry.at) }}</span>
                                    <span class="mx-1">·</span>
                                    <span>{{ changeOf(entry) }}</span>
                                    <span class="text-medium-emphasis ml-1">{{
                                        t(`orders.historyBy.${entry.by}`)
                                    }}</span>
                                </li>
                            </ol>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="5">
                    <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                            {{ t('orders.summaryTitle') }}
                        </v-card-title>
                        <v-card-text>
                            <order-quote :quote="order.quote" />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <v-dialog v-model="confirming" max-width="480">
                <v-card>
                    <v-card-title class="text-h6 text-wrap">
                        {{ t('orders.cancelTitle', { number: order.orderNumber }) }}
                    </v-card-title>
                    <v-card-text>{{ t('orders.cancelText') }}</v-card-text>
                    <v-card-actions class="flex-wrap">
                        <v-spacer />
                        <v-btn variant="text" @click="confirming = false">{{ t('orders.keep') }}</v-btn>
                        <v-btn color="error" variant="flat" :loading="orders.cancelling" @click="cancelOrder">
                            {{ t('orders.cancelConfirm') }}
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </template>
    </v-container>
</template>

<script setup>
import OrderQuote from '@/components/features/orders/OrderQuote.vue'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { localeRoute } from '@/router/locale'
import { useOrdersStore } from '@/stores'
import { formatDate, formatDateTime, formatMoney } from '@/utils'
import { isCancellable, STATUS_COLORS } from '@/utils/orderStatus'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const orders = useOrdersStore()
const confirming = ref(false)

const order = computed(() => orders.current)

const breadcrumbItems = computed(() => [
    { title: t('routes.Orders'), to: localeRoute('Orders') },
    { title: order.value?.orderNumber ?? t('routes.OrderDetails'), disabled: true },
])

const changeOf = (entry) =>
    entry.axis === 'payment' ? t(`orders.payment.${entry.to}`) : t(`orders.status.${entry.to}`)

const load = () => orders.fetchOne(route.params.id)

async function cancelOrder() {
    if (await orders.cancel(order.value.id)) confirming.value = false
}

// A switch of language keeps the id; another order in the URL loads that one
watch(() => route.params.id, load, { immediate: true })
</script>

<style scoped>
.order-lines,
.order-history {
    list-style: none;
    padding: 0;
    overflow-wrap: anywhere;
}

.order-address {
    font-style: normal;
    overflow-wrap: anywhere;
}
</style>
