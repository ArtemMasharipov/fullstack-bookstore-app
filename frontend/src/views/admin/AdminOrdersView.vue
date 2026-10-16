<template>
    <div class="admin-orders">
        <!-- Orders management data table -->
        <admin-data-table
            :headers="headers"
            :items="rows"
            :loading="loading"
            :total-items="totalItems"
            :page="page"
            :items-per-page="itemsPerPage"
            :search="search"
            title="Orders Management"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            @update:search="updateSearch"
            @reset-filters="resetFilters"
        >
            <!-- Table actions -->
            <template #actions>
                <v-btn color="primary" prepend-icon="mdi-reload" @click="loadOrders"> Refresh Orders </v-btn>
            </template>

            <template #item.createdAt="{ item }">
                {{ formatDate(rowOf(item).createdAt) }}
            </template>

            <!-- Status column -->
            <template #item.status="{ item }">
                <v-chip size="small" :color="STATUS_COLORS[rowOf(item).status] || 'grey'" class="text-uppercase">
                    {{ rowOf(item).status }}
                </v-chip>
            </template>

            <template #item.paymentStatus="{ item }">
                <v-chip size="small" variant="outlined">{{ rowOf(item).paymentStatus }}</v-chip>
            </template>

            <!-- Total column -->
            <template #item.total="{ item }">
                {{ formatMoney(rowOf(item).quote.total, rowOf(item).quote.currency) }}
            </template>

            <!-- Actions column -->
            <template #item.actions="{ item }">
                <div class="d-flex justify-center">
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="primary"
                        class="mr-1"
                        aria-label="View Details"
                        @click="viewOrderDetails(rowOf(item))"
                    >
                        <v-icon>mdi-eye</v-icon>
                        <v-tooltip activator="parent" location="top">View Details</v-tooltip>
                    </v-btn>
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="warning"
                        class="mr-1 edit-status"
                        aria-label="Update Status"
                        @click="updateOrderStatus(rowOf(item))"
                    >
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">Update Status</v-tooltip>
                    </v-btn>
                </div>
            </template>
        </admin-data-table>

        <!-- Order details dialog -->
        <v-dialog v-model="detailsDialogOpen" max-width="800px">
            <v-card v-if="detailsOrder">
                <v-card-title class="text-h5 bg-primary text-white text-wrap">
                    Order Details: {{ detailsOrder.orderNumber }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-row>
                        <v-col cols="12" md="6">
                            <p><strong>Customer:</strong> {{ customerOf(detailsOrder) }}</p>
                            <p><strong>Date:</strong> {{ formatDateTime(detailsOrder.createdAt) }}</p>
                            <p>
                                <strong>Status:</strong>
                                <v-chip
                                    size="small"
                                    :color="STATUS_COLORS[detailsOrder.status] || 'grey'"
                                    class="text-uppercase"
                                >
                                    {{ detailsOrder.status }}
                                </v-chip>
                            </p>
                            <p><strong>Payment:</strong> {{ detailsOrder.paymentStatus }}</p>
                            <p><strong>Total Amount:</strong> {{ money(detailsOrder, detailsOrder.quote.total) }}</p>
                        </v-col>

                        <v-col cols="12" md="6">
                            <p><strong>Shipping Address:</strong></p>
                            <p>{{ detailsOrder.shippingAddress.fullName }}</p>
                            <p>{{ detailsOrder.shippingAddress.line1 }}</p>
                            <p>
                                {{ `${detailsOrder.shippingAddress.postalCode} ${detailsOrder.shippingAddress.city}` }}
                            </p>
                            <p>{{ formatCountry(detailsOrder.shippingAddress.country) }}</p>
                            <p v-if="detailsOrder.shippingAddress.phone">{{ detailsOrder.shippingAddress.phone }}</p>
                        </v-col>
                    </v-row>

                    <v-divider class="my-4"></v-divider>

                    <h3 class="text-h6 mb-3">Order Items</h3>
                    <v-table density="compact">
                        <thead>
                            <tr>
                                <th>Book</th>
                                <th class="text-right">Price</th>
                                <th class="text-right">Quantity</th>
                                <th class="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in detailsOrder.items" :key="item.bookId">
                                <td>{{ item.title }}</td>
                                <td class="text-right">{{ money(detailsOrder, item.unitPrice) }}</td>
                                <td class="text-right">{{ item.quantity }}</td>
                                <td class="text-right">{{ money(detailsOrder, item.lineTotal) }}</td>
                            </tr>
                            <tr class="font-weight-bold">
                                <td colspan="3" class="text-right">Total:</td>
                                <td class="text-right">{{ money(detailsOrder, detailsOrder.quote.total) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeDetailsDialog">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- Status update dialog -->
        <v-dialog v-model="statusDialogOpen" max-width="500px">
            <v-card v-if="statusOrder">
                <v-card-title class="text-h5 bg-primary text-white"> Update Order Status </v-card-title>

                <v-card-text class="pt-4">
                    <v-radio-group v-model="editedStatus" label="Status">
                        <v-radio v-for="status in ORDER_STATUSES" :key="status" :label="status" :value="status" />
                    </v-radio-group>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeStatusDialog">Cancel</v-btn>
                    <v-btn
                        color="primary"
                        :loading="saving"
                        :disabled="!editedStatus || editedStatus === statusOrder.status"
                        @click="handleSaveOrderStatus"
                    >
                        Save
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'

// Components
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'

// Stores
import { useOrdersStore } from '@/stores'

// Utilities
import { formatCountry, formatDate, formatDateTime, formatMoney } from '@/utils'
import { logger } from '@/utils/logger'
import { STATUS_COLORS } from '@/utils/orderStatus'

const ORDER_STATUSES = Object.keys(STATUS_COLORS)

// Store instance
const ordersStore = useOrdersStore()

// Table configuration; the server sorts newest first
const headers = [
    { title: 'Order', align: 'start', key: 'orderNumber', sortable: false },
    { title: 'Customer', align: 'start', key: 'customerEmail', sortable: false },
    { title: 'Date', align: 'start', key: 'createdAt', sortable: false },
    { title: 'Total', align: 'start', key: 'total', sortable: false },
    { title: 'Status', align: 'center', key: 'status', sortable: false },
    { title: 'Payment', align: 'center', key: 'paymentStatus', sortable: false },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
]

// Data table state
const page = ref(1)
const itemsPerPage = ref(10)
const search = ref('')

// Dialog states
const detailsDialogOpen = ref(false)
const statusDialogOpen = ref(false)
const saving = ref(false)

// Order details
const detailsOrder = ref(null)
const statusOrder = ref(null)
const editedStatus = ref('')

// Older Vuetify versions wrap the row in `raw`
const rowOf = (item) => item.raw ?? item
const customerOf = (order) => order.customer?.email ?? 'Deleted account'
const money = (order, amount) => formatMoney(amount, order.quote.currency)

const rows = computed(() => ordersStore.admin.list.map((order) => ({ ...order, customerEmail: customerOf(order) })))
const loading = computed(() => ordersStore.admin.status === 'loading')
const totalItems = computed(() => ordersStore.admin.pagination?.total ?? 0)

// Data table methods
const updatePage = (newPage) => {
    page.value = newPage
}

const updateItemsPerPage = (newValue) => {
    itemsPerPage.value = newValue
    page.value = 1
}

const updateSearch = (newValue) => {
    search.value = newValue
    page.value = 1
}

const resetFilters = () => {
    search.value = ''
    page.value = 1
}

// Order management methods
const loadOrders = () => ordersStore.fetchAdminList({ page: page.value, limit: itemsPerPage.value })

// Order details dialog
const viewOrderDetails = (order) => {
    detailsOrder.value = order
    detailsDialogOpen.value = true
}

const closeDetailsDialog = () => {
    detailsDialogOpen.value = false
    detailsOrder.value = null
}

// Status update dialog
const updateOrderStatus = (order) => {
    statusOrder.value = order
    editedStatus.value = order.status
    statusDialogOpen.value = true
}

const closeStatusDialog = () => {
    statusDialogOpen.value = false
    saving.value = false
    statusOrder.value = null
    editedStatus.value = ''
}

const handleSaveOrderStatus = async () => {
    if (!statusOrder.value) return

    saving.value = true
    try {
        await ordersStore.setAdminStatus(statusOrder.value.id, editedStatus.value)
        logger.info(`Order status updated to ${editedStatus.value}`, 'admin-orders')
        closeStatusDialog()
        await loadOrders()
    } catch (error) {
        logger.error('Failed to update order status', error, 'admin-orders')
    } finally {
        saving.value = false
    }
}

watch([page, itemsPerPage], loadOrders)

onMounted(() => {
    loadOrders()
})
</script>

<style scoped>
.admin-orders {
    width: 100%;
}
</style>
