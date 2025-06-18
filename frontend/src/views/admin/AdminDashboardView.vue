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
                        <v-btn variant="text" :to="{ path: '/admin/books' }">
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
                        <v-btn variant="text" :to="{ path: '/admin/authors' }">
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
                        <v-btn variant="text" :to="{ path: '/admin/orders' }">
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
                        <v-btn variant="text" :to="{ path: '/admin/users' }">
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
                    <v-chip :color="item.raw && item.raw.status ? getOrderStatusColor(item.raw.status) : 'grey'"
                        size="small" class="text-uppercase">
                        {{ item.raw && item.raw.status ? item.raw.status : 'Unknown' }}
                    </v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                    <v-btn density="compact" icon variant="text"
                        :to="{ path: item.raw && item.raw._id ? `/admin/orders/${item.raw._id}` : '/admin/orders' }"
                        :disabled="!item.raw || !item.raw._id">
                        <v-icon>mdi-eye</v-icon>
                    </v-btn>
                </template>
            </v-data-table>
        </v-card>
        <!-- Activity section -->
        <div class="d-flex align-center justify-space-between mt-6 mb-2">
            <h2 class="text-h5">Recent Activity</h2>
        </div>

        <v-timeline density="compact" align="start">
            <v-timeline-item v-for="(activity, i) in recentActivity" :key="i" :dot-color="activity.color || 'grey'"
                :icon="activity.icon || 'mdi-information'">
                <div class="d-flex justify-space-between">
                    <div>
                        <div class="text-subtitle-2 font-weight-medium">
                            {{ activity.title || 'Event' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ activity.description || 'No details available' }}
                        </div>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                        {{ activity.time || 'Unknown time' }}
                    </div>
                </div>
            </v-timeline-item>
        </v-timeline>
    </div>
</template>

<script setup>
import { useAuthorsStore, useBooksStore, useOrdersStore, useUsersStore } from '@/store'
import { formatPrice } from '@/utils'
import { logger } from '@/utils/logger'
import { onMounted, ref } from 'vue'

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

// Recent orders
const recentOrders = ref([])

// Order table headers
const orderHeaders = [
    { title: 'Order ID', align: 'start', key: '_id' },
    { title: 'Customer', align: 'start', key: 'customer' },
    { title: 'Date', align: 'start', key: 'date' },
    { title: 'Total', align: 'start', key: 'total' },
    { title: 'Status', align: 'start', key: 'status' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
]

// Recent activity
const recentActivity = [
    {
        color: 'green',
        icon: 'mdi-package-variant',
        title: 'New order #38290',
        description: 'A new order has been placed',
        time: '2 minutes ago',
    },
    {
        color: 'blue',
        icon: 'mdi-account',
        title: 'New user registration',
        description: 'John Doe has registered',
        time: '1 hour ago',
    },
    {
        color: 'amber',
        icon: 'mdi-book',
        title: 'Book inventory updated',
        description: 'Inventory levels have been adjusted',
        time: '3 hours ago',
    },
    {
        color: 'red',
        icon: 'mdi-alert-circle',
        title: 'Stock alert',
        description: '"To Kill a Mockingbird" is low in stock',
        time: '5 hours ago',
    },
]

// Load dashboard data
const loadDashboardData = async () => {
    try {
        // Load statistics
        await Promise.all([
            booksStore.fetchBooks(),
            authorsStore.fetchAuthors(),
            ordersStore.fetchOrders(),
            usersStore.fetchUsers(),
        ])

        stats.value = {
            books: booksStore.booksList?.length || 0,
            authors: authorsStore.authorsList?.length || 0,
            orders: ordersStore.ordersList?.length || 0,
            users: usersStore.usersList?.length || 0,
        }

        // Process recent orders
        const processedOrders = ordersStore.ordersList
            ? ordersStore.ordersList.slice(0, 5).map((order) => ({
                _id: order._id ? order._id.slice(-6) : 'N/A',
                customer: order.user ? order.user.name || order.user.email || 'Guest' : 'Guest',
                date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A',
                total: order.total !== undefined ? formatPrice(order.total) : formatPrice(0),
                status: order.status || 'pending',
            }))
            : []

        recentOrders.value = processedOrders
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
