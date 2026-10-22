<template>
    <div>
        <v-row>
            <v-col v-for="card in cards" :key="card.key" cols="12" sm="6" lg="3">
                <v-card
                    tag="section"
                    variant="outlined"
                    height="100%"
                    :data-card="card.key"
                    :aria-labelledby="`dashboard-${card.key}`"
                >
                    <v-card-text>
                        <h2 :id="`dashboard-${card.key}`" class="text-subtitle-1 mb-2">{{ card.label }}</h2>
                        <p v-if="resources[card.resource].loading" role="status">{{ t('common.loading') }}</p>
                        <div v-else-if="resources[card.resource].error" role="alert">
                            <p class="mb-2">{{ t('admin.dashboard.loadError') }}</p>
                            <v-btn
                                variant="outlined"
                                :aria-label="t('admin.dashboard.retry', { name: card.label })"
                                @click="reload(card.resource)"
                                >{{ t('errors.retry') }}</v-btn
                            >
                        </div>
                        <template v-else>
                            <p class="text-h4 text-break">{{ card.value }}</p>
                            <p v-if="card.key === 'users'">
                                {{ t('admin.dashboard.activeUsers', { count: resources.users.data.active }) }}
                            </p>
                        </template>
                    </v-card-text>
                    <v-card-actions
                        ><v-btn variant="text" :to="localeRoute(card.route)" append-icon="mdi-arrow-right">{{
                            t(`routes.${card.route}`)
                        }}</v-btn></v-card-actions
                    >
                </v-card>
            </v-col>
        </v-row>
        <h2 class="text-h6 my-4">{{ t('admin.dashboard.recent') }}</h2>
        <p v-if="resources.recent.loading" role="status">{{ t('common.loading') }}</p>
        <v-alert v-else-if="resources.recent.error" type="error">
            <p class="mb-2">{{ t('admin.dashboard.loadError') }}</p>
            <v-btn variant="outlined" @click="reload('recent')">{{ t('errors.retry') }}</v-btn>
        </v-alert>
        <p v-else-if="!resources.recent.data?.length">{{ t('admin.orders.empty') }}</p>
        <v-table v-else>
            <thead>
                <tr>
                    <th v-for="key in columns" :key="key" scope="col">{{ t(`admin.orders.columns.${key}`) }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="order in resources.recent.data" :key="order.id">
                    <td>
                        <router-link
                            class="admin-dashboard__link"
                            :to="localeRoute('AdminOrderDetails', { params: { id: order.id } })"
                            >{{ order.orderNumber }}</router-link
                        >
                    </td>
                    <td>{{ order.customer?.email ?? t('admin.orders.deletedCustomer') }}</td>
                    <td>{{ formatDateTime(order.createdAt) }}</td>
                    <td class="text-no-wrap">{{ formatMoney(order.quote.total, order.quote.currency) }}</td>
                    <td>{{ t(`orders.status.${order.status}`) }}</td>
                    <td>{{ t(`orders.payment.${order.paymentStatus}`) }}</td>
                </tr>
            </tbody>
        </v-table>
    </div>
</template>
<script setup>
import { computed } from 'vue'
import { useAdminDashboard } from '@/composables/useAdminDashboard'
import { t } from '@/i18n'
import { localeRoute } from '@/router/locale'
import { formatDateTime, formatMoney } from '@/utils'
const { resources, reload } = useAdminDashboard()
const columns = ['orderNumber', 'customer', 'createdAt', 'total', 'status', 'paymentStatus']
const cards = computed(() =>
    [
        { key: 'books', resource: 'books', value: resources.books.data, route: 'AdminBooks' },
        { key: 'authors', resource: 'authors', value: resources.authors.data, route: 'AdminAuthors' },
        { key: 'total', resource: 'orders', value: resources.orders.data?.total, route: 'AdminOrders' },
        { key: 'pending', resource: 'orders', value: resources.orders.data?.pendingOrders, route: 'AdminOrders' },
        { key: 'paid', resource: 'orders', value: resources.orders.data?.paidOrders, route: 'AdminOrders' },
        {
            key: 'revenue',
            resource: 'orders',
            value: resources.orders.data
                ? formatMoney(resources.orders.data.totalRevenue, resources.orders.data.currency)
                : null,
            route: 'AdminOrders',
        },
        { key: 'users', resource: 'users', value: resources.users.data?.total, route: 'AdminUsers' },
    ].map((card) => ({ ...card, label: t(`admin.dashboard.cards.${card.key}`) }))
)
</script>
<style scoped>
.admin-dashboard__link {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
}
</style>
