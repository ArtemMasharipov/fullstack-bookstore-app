<template>
    <admin-table
        must-sort
        :headers="headers"
        :items="error ? [] : items"
        :items-length="total"
        :loading="loading"
        :error="error"
        :page="state.page"
        :limit="state.limit"
        :sort-by="state.sortBy"
        :filtered="filtered"
        :empty-text="t(filtered ? 'admin.orders.noResults' : 'admin.orders.empty')"
        @update:page="update({ page: $event })"
        @update:limit="update({ limit: $event })"
        @update:sort-by="update({ sortBy: $event ?? ORDERS_LIST.defaultSort })"
        @retry="reload"
        @reset-filters="resetFilters"
    >
        <template #toolbar>
            <div class="admin-orders__filters">
                <v-select
                    :model-value="state.filters.status ?? ''"
                    :items="statuses"
                    :label="t('admin.orders.status')"
                    :open-text="t('admin.orders.status')"
                    :close-text="t('admin.orders.status')"
                    hide-details
                    @update:model-value="filter('status', $event)"
                />
                <v-select
                    :model-value="state.filters.paymentStatus ?? ''"
                    :items="payments"
                    :label="t('admin.orders.payment')"
                    :open-text="t('admin.orders.payment')"
                    :close-text="t('admin.orders.payment')"
                    hide-details
                    @update:model-value="filter('paymentStatus', $event)"
                />
                <v-select
                    :model-value="state.sortBy"
                    :items="sorts"
                    :label="t('admin.orders.sort')"
                    :open-text="t('admin.orders.sort')"
                    :close-text="t('admin.orders.sort')"
                    hide-details
                    @update:model-value="update({ sortBy: $event })"
                />
            </div>
            <v-btn v-if="filtered" variant="text" class="mt-2" @click="resetFilters">{{
                t('catalog.resetFilters')
            }}</v-btn>
        </template>
        <template #item.customer="{ item }">{{ item.customer?.email ?? t('admin.orders.deletedCustomer') }}</template>
        <template #item.createdAt="{ item }">{{ formatDateTime(item.createdAt) }}</template>
        <template #item.total="{ item }">{{ formatMoney(item.quote.total, item.quote.currency) }}</template>
        <template #item.status="{ item }"
            ><v-chip size="small" variant="tonal" :color="STATUS_COLORS[item.status]">{{
                t(`orders.status.${item.status}`)
            }}</v-chip></template
        >
        <template #item.paymentStatus="{ item }"
            ><v-chip size="small" variant="tonal">{{ t(`orders.payment.${item.paymentStatus}`) }}</v-chip></template
        >
    </admin-table>
</template>
<script setup>
import { computed } from 'vue'
import AdminTable from '@/components/features/admin/AdminTable.vue'
import { useAdminList } from '@/composables/useAdminList'
import { t } from '@/i18n'
import { orderApi } from '@/services/api/orderApi'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { STATUS_COLORS } from '@/utils/orderStatus'
import { ORDERS_LIST } from './adminListConfig'
const { state, items, total, loading, error, update, reload } = useAdminList({
    config: ORDERS_LIST,
    load: async (params) => {
        const { items, pagination } = await orderApi.adminList(params)
        return { data: items, pagination }
    },
})
const filtered = computed(() => Boolean(Object.keys(state.value.filters).length))
const headers = computed(() =>
    ['orderNumber', 'customer', 'createdAt', 'total', 'status', 'paymentStatus'].map((key) => ({
        key,
        title: t(`admin.orders.columns.${key}`),
        sortable: key === 'createdAt',
    }))
)
const statuses = computed(() => [
    { value: '', title: t('admin.orders.allStatuses') },
    ...Object.keys(STATUS_COLORS).map((value) => ({ value, title: t(`orders.status.${value}`) })),
])
const payments = computed(() => [
    { value: '', title: t('admin.orders.allPayments') },
    ...['unpaid', 'paid', 'failed', 'refunded'].map((value) => ({ value, title: t(`orders.payment.${value}`) })),
])
const sorts = computed(() =>
    ORDERS_LIST.sorts.map((value) => ({
        value,
        title: t(value.startsWith('-') ? 'admin.orders.newest' : 'admin.orders.oldest'),
    }))
)
const filter = (key, value) => update({ filters: { ...state.value.filters, [key]: value } })
const resetFilters = () => update({ filters: {} })
</script>
<style scoped>
.admin-orders__filters {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}
@media (max-width: 959px) {
    .admin-orders__filters {
        grid-template-columns: 1fr;
    }
}
</style>
