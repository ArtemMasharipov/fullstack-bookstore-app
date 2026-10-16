<template>
    <div class="admin-dashboard">
        <v-row>
            <v-col cols="12" sm="6" md="3">
                <v-card color="primary" theme="dark" class="text-center mb-4">
                    <v-card-title class="text-h4">{{ stats.books || 0 }}</v-card-title>
                    <v-card-text>
                        <div class="text-subtitle-2 font-weight-regular">Books</div>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn variant="text" :to="localeRoute('AdminBooks')">
                            Manage Books
                            <v-icon end>mdi-arrow-right</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="success" theme="dark" class="text-center mb-4">
                    <v-card-title class="text-h4">{{ stats.authors || 0 }}</v-card-title>
                    <v-card-text>
                        <div class="text-subtitle-2 font-weight-regular">Authors</div>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn variant="text" :to="localeRoute('AdminAuthors')">
                            Manage Authors
                            <v-icon end>mdi-arrow-right</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="warning" theme="dark" class="text-center mb-4">
                    <v-card-title class="text-h4">{{ stats.orders || 0 }}</v-card-title>
                    <v-card-text>
                        <div class="text-subtitle-2 font-weight-regular">Orders</div>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn variant="text" :to="localeRoute('AdminOrders')">
                            View Orders
                            <v-icon end>mdi-arrow-right</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>

            <v-col cols="12" sm="6" md="3">
                <v-card color="info" theme="dark" class="text-center mb-4">
                    <v-card-title class="text-h4">{{ stats.users || 0 }}</v-card-title>
                    <v-card-text>
                        <div class="text-subtitle-2 font-weight-regular">Users</div>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn variant="text" :to="localeRoute('AdminUsers')">
                            Manage Users
                            <v-icon end>mdi-arrow-right</v-icon>
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>

        <!-- Recent orders section -->
        <h2 class="text-h5 my-4">Recent Orders</h2>
        <v-card>
            <v-data-table :headers="orderHeaders" :items="recentOrders" class="elevation-0" density="comfortable">
                <template v-slot:item.status="{ item }">
                    <v-chip :color="getOrderStatusColor((item.raw ?? item).status)" size="small" class="text-uppercase">
                        {{ (item.raw ?? item).status }}
                    </v-chip>
                </template>
                <template v-slot:item.actions>
                    <v-btn density="compact" icon variant="text" :to="localeRoute('AdminOrders')" aria-label="Orders">
                        <v-icon>mdi-eye</v-icon>
                    </v-btn>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>

<script setup>
import { localeRoute } from '@/router/locale'
import { useAuthorsStore, useBooksStore, useOrdersStore, useUsersStore } from '@/stores'
import { formatDate, formatMoney } from '@/utils'
import { logger } from '@/utils/logger'
import { computed, onMounted, ref } from 'vue'

const booksStore = useBooksStore()
const authorsStore = useAuthorsStore()
const ordersStore = useOrdersStore()
const usersStore = useUsersStore()

// Dashboard statistics
const stats = ref({
    books: 0,
    authors: 0,
    orders: 0,
    users: 0,
})

// Recent orders: the newest five from the admin list
const recentOrders = computed(() =>
    ordersStore.admin.list.slice(0, 5).map((order) => ({
        orderNumber: order.orderNumber,
        customer: order.customer?.email ?? 'Deleted account',
        date: formatDate(order.createdAt),
        total: formatMoney(order.quote.total, order.quote.currency),
        status: order.status,
    }))
)

// Order table headers
const orderHeaders = [
    { title: 'Order', align: 'start', key: 'orderNumber' },
    { title: 'Customer', align: 'start', key: 'customer' },
    { title: 'Date', align: 'start', key: 'date' },
    { title: 'Total', align: 'start', key: 'total' },
    { title: 'Status', align: 'start', key: 'status' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
]

// Load dashboard data
const loadDashboardData = async () => {
    try {
        // Load statistics
        await Promise.all([
            booksStore.fetchBooks(),
            authorsStore.fetchAuthors(),
            ordersStore.fetchAdminList({ limit: 5 }),
            usersStore.fetchUsers(),
        ])

        stats.value = {
            books: booksStore.books?.length || 0,
            authors: authorsStore.list?.length || 0,
            orders: ordersStore.admin.pagination?.total ?? 0,
            users: usersStore.usersList?.length || 0,
        }
    } catch (error) {
        logger.error('Failed to load dashboard data', error, 'admin-dashboard')
    }
}

// Get color for order status
const getOrderStatusColor = (status) => {
    const colors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'success',
        delivered: 'primary',
        cancelled: 'error',
    }
    return colors[status] || 'grey'
}

onMounted(() => {
    loadDashboardData()
})
</script>
