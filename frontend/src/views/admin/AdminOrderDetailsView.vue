<template>
    <div class="admin-order">
        <v-btn :to="back" variant="text" prepend-icon="mdi-arrow-left" class="mb-4">{{
            t('admin.orderDetails.back')
        }}</v-btn>
        <v-progress-linear v-if="loading" indeterminate :aria-label="t('common.loading')" class="mb-4" />
        <v-alert v-if="error" type="error">
            <p>{{ t(resolveErrorKey(error)) }}</p>
            <v-btn variant="outlined" @click="reload">{{ t('errors.retry') }}</v-btn>
        </v-alert>
        <template v-else-if="order">
            <h2 class="text-h6 text-break mb-2">{{ t('orders.number', { number: order.orderNumber }) }}</h2>
            <p class="mb-4">{{ formatDateTime(order.createdAt) }}</p>
            <div class="d-flex flex-wrap ga-2 mb-4">
                <v-chip variant="tonal" :color="STATUS_COLORS[order.status]">{{
                    t(`orders.status.${order.status}`)
                }}</v-chip>
                <v-chip variant="tonal">{{ t(`orders.payment.${order.paymentStatus}`) }}</v-chip>
            </div>
            <v-row>
                <v-col cols="12" md="7">
                    <v-card variant="outlined" class="mb-4"
                        ><v-card-text>
                            <h3 class="text-subtitle-1 mb-2">{{ t('admin.orders.columns.customer') }}</h3>
                            <p>{{ order.customer?.email ?? t('admin.orders.deletedCustomer') }}</p>
                            <p v-if="order.customer">{{ order.customer.username }}</p>
                            <h3 class="text-subtitle-1 mt-4 mb-2">{{ t('orders.addressTitle') }}</h3>
                            <address>
                                <span>{{ order.shippingAddress.fullName }}</span>
                                <span>{{ order.shippingAddress.line1 }}</span>
                                <span>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</span>
                                <span>{{ formatCountry(order.shippingAddress.country) }}</span>
                                <span v-if="order.shippingAddress.phone">{{ order.shippingAddress.phone }}</span>
                            </address>
                        </v-card-text></v-card
                    >
                    <v-card variant="outlined" class="mb-4"
                        ><v-card-text>
                            <h3 class="text-subtitle-1 mb-3">{{ t('orders.itemsTitle') }}</h3>
                            <ul class="admin-order__lines">
                                <li
                                    v-for="(item, index) in order.items"
                                    :key="index"
                                    class="d-flex justify-space-between ga-3 mb-3"
                                >
                                    <div>
                                        <p>{{ item.title }}</p>
                                        <p class="text-caption">
                                            {{
                                                t('checkout.lineQuantity', {
                                                    quantity: item.quantity,
                                                    price: money(item.unitPrice),
                                                })
                                            }}
                                        </p>
                                    </div>
                                    <span class="text-no-wrap">{{ money(item.lineTotal) }}</span>
                                </li>
                            </ul>
                        </v-card-text></v-card
                    >
                    <v-card variant="outlined"
                        ><v-card-text>
                            <h3 class="text-subtitle-1 mb-3">{{ t('orders.historyTitle') }}</h3>
                            <p v-if="!order.statusHistory.length">{{ t('admin.orderDetails.noHistory') }}</p>
                            <ol v-else class="admin-order__lines">
                                <li v-for="(entry, index) in order.statusHistory" :key="index" class="mb-2">
                                    {{ formatDateTime(entry.at) }} ·
                                    {{
                                        t('admin.orderDetails.historyChange', {
                                            from: changeLabel(entry.axis, entry.from),
                                            to: changeLabel(entry.axis, entry.to),
                                        })
                                    }}
                                    · {{ t(`admin.orderDetails.historyBy.${entry.by}`) }}
                                </li>
                            </ol>
                        </v-card-text></v-card
                    >
                </v-col>
                <v-col cols="12" md="5">
                    <v-card variant="outlined" class="mb-4"
                        ><v-card-text>
                            <h3 class="text-subtitle-1 mb-3">{{ t('orders.summaryTitle') }}</h3>
                            <order-quote :quote="order.quote" /> </v-card-text
                    ></v-card>
                    <v-card variant="outlined"
                        ><v-card-text>
                            <h3 ref="actionsHeading" tabindex="-1" class="text-subtitle-1 mb-3">
                                {{ t('admin.orderDetails.actionsTitle') }}
                            </h3>
                            <v-alert v-if="actionError" type="error" class="mb-3">{{
                                t(resolveErrorKey(actionError))
                            }}</v-alert>
                            <p v-if="!order.allowedTransitions.length">{{ t('admin.orderDetails.noActions') }}</p>
                            <div class="d-flex flex-column ga-3">
                                <v-btn
                                    v-for="action in order.allowedTransitions"
                                    :key="`${action.axis}-${action.to}`"
                                    variant="outlined"
                                    :disabled="loading || mutating"
                                    @click="ask(action)"
                                    >{{ actionLabel(action) }}</v-btn
                                >
                            </div>
                        </v-card-text></v-card
                    >
                </v-col>
            </v-row>
        </template>
        <confirm-modal
            v-model="confirming"
            :title="confirmTitle"
            :message="confirmMessage"
            @confirm="perform"
            @after-leave="restoreFocus"
        />
    </div>
</template>
<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAdminOrder } from '@/composables/useAdminOrder'
import OrderQuote from '@/components/features/orders/OrderQuote.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import { listQuery, parseListQuery } from '@/router/adminListQuery'
import { formatCountry, formatDateTime, formatMoney } from '@/utils'
import { STATUS_COLORS } from '@/utils/orderStatus'
import { resolveErrorKey } from '@/utils/errorResolver'
import { ORDERS_LIST } from './adminListConfig'
const route = useRoute()
const { order, loading, error, mutating, actionError, reload, transition } = useAdminOrder()
const back = computed(() =>
    localeRoute('AdminOrders', { query: listQuery(parseListQuery(route.query, ORDERS_LIST), ORDERS_LIST) })
)
const money = (amount) => formatMoney(amount, order.value.quote.currency)
const changeLabel = (axis, status) =>
    status ? t(`orders.${axis === 'payment' ? 'payment' : 'status'}.${status}`) : t('common.notAvailable')
const actionLabel = (action) => t(`admin.orderDetails.actions.${action.to}`)
const confirming = ref(false),
    selected = ref(null),
    actionsHeading = ref(null)
let opener = null
const confirmTitle = computed(() => (selected.value ? actionLabel(selected.value) : ''))
const confirmMessage = computed(() =>
    selected.value?.to === 'refunded' || (selected.value?.to === 'cancelled' && order.value?.paymentStatus === 'paid')
        ? t('admin.orderDetails.manualRefund')
        : t('admin.orderDetails.confirmText')
)
function ask(action) {
    if (loading.value || mutating.value) return
    opener = document.activeElement
    selected.value = { ...action, id: route.params.id }
    confirming.value = true
}
async function restoreFocus() {
    await nextTick()
    if (confirming.value || mutating.value || loading.value) return
    if (
        document.activeElement !== document.body &&
        document.activeElement !== opener &&
        !document.activeElement?.closest('.v-overlay')
    )
        return
    if (opener?.isConnected && !opener.disabled) opener.focus()
    else actionsHeading.value?.focus()
}
async function perform() {
    const action = selected.value
    if (!action || action.id !== route.params.id) return
    await transition(action)
    await restoreFocus()
}
watch(
    () => route.params.id,
    () => {
        confirming.value = false
        selected.value = null
        opener = null
    }
)
</script>
<style scoped>
.admin-order {
    overflow-wrap: anywhere;
}
.admin-order address {
    font-style: normal;
}
.admin-order address span {
    display: block;
}
.admin-order__lines {
    list-style: none;
    padding: 0;
}
</style>
