<template>
    <v-container class="py-6">
        <h1 class="text-h4 font-weight-bold mb-6">{{ t('orders.title') }}</h1>

        <div v-if="orders.listStatus === 'idle' || orders.listStatus === 'loading'">
            <v-skeleton-loader v-for="n in 3" :key="n" type="list-item-two-line" class="mb-3" />
        </div>

        <error-message
            v-else-if="orders.listStatus === 'error'"
            :code="orders.listError"
            :on-retry="load"
            :closable="false"
        />

        <v-alert v-else-if="orders.list.length === 0" type="info" variant="tonal" icon="mdi-package-variant">
            {{ t('orders.empty') }}
            <div class="mt-2">
                <v-btn variant="text" :to="localeRoute('Books')" prepend-icon="mdi-book-open-page-variant-outline">
                    {{ t('cart.browse') }}
                </v-btn>
            </div>
        </v-alert>

        <template v-else>
            <v-card v-for="order in orders.list" :key="order.id" variant="outlined" class="order-row mb-3">
                <v-card-item>
                    <v-card-title class="text-h6 text-wrap">
                        <router-link :to="localeRoute('OrderDetails', { params: { id: order.id } })">
                            {{ order.orderNumber }}
                        </router-link>
                    </v-card-title>
                    <v-card-subtitle>{{ formatDate(order.createdAt) }}</v-card-subtitle>
                </v-card-item>
                <v-card-text class="d-flex flex-wrap align-center ga-2">
                    <v-chip size="small" :color="STATUS_COLORS[order.status]" variant="tonal">
                        {{ t(`orders.status.${order.status}`) }}
                    </v-chip>
                    <v-chip size="small" variant="outlined">{{ t(`orders.payment.${order.paymentStatus}`) }}</v-chip>
                    <span class="text-body-2">{{ t('orders.bookCount', { count: order.itemCount }) }}</span>
                    <v-spacer />
                    <span class="text-subtitle-1 font-weight-bold">{{ formatMoney(order.total, order.currency) }}</span>
                </v-card-text>
            </v-card>

            <v-pagination
                v-if="orders.pagination?.pages > 1"
                :model-value="page"
                :length="orders.pagination.pages"
                :total-visible="5"
                class="mt-4"
                @update:model-value="goTo"
            />
        </template>
    </v-container>
</template>

<script setup>
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { localeRoute } from '@/router/locale'
import { useOrdersStore } from '@/stores'
import { formatDate, formatMoney } from '@/utils'
import { STATUS_COLORS } from '@/utils/orderStatus'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const orders = useOrdersStore()

// The page lives in the URL, so it survives a reload and the back button
const page = computed(() => {
    const value = Number.parseInt(route.query.page, 10)
    return Number.isInteger(value) && value > 0 ? value : 1
})

const load = () => orders.fetchList(page.value)
const goTo = (next) => router.push(localeRoute('Orders', { query: { ...route.query, page: String(next) } }))

watch(page, load, { immediate: true })
</script>

<style scoped>
.order-row a {
    color: inherit;
}
</style>
