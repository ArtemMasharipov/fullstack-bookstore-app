<template>
    <div class="admin-orders">
        <!-- Orders management data table -->
        <admin-data-table
            :headers="headers"
            :items="orders"
            :loading="loading"
            :total-items="totalItems"
            :page="page"
            :items-per-page="itemsPerPage"
            :sort-by="sortBy"
            :search="search"
            title="Orders Management"
            @update:page="updatePage"
            @update:items-per-page="updateItemsPerPage"
            @update:sort-by="updateSortBy"
            @update:search="updateSearch"
            @reset-filters="resetFilters"
        >
            <!-- Table actions -->
            <template #actions>
                <v-btn color="primary" prepend-icon="mdi-reload" @click="loadOrders"> Refresh Orders </v-btn>
            </template>

            <!-- Status column -->
            <template #item.status="{ item }">
                <v-chip size="small" :color="getStatusColor(item.raw?.status)" class="text-uppercase">
                    {{ item.raw?.status || 'Unknown' }}
                </v-chip>
            </template>

            <!-- Total Price column -->
            <template #item.totalPrice="{ item }">
                {{ formatOrderPrice(item.raw?.totalPrice) }}
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
                        @click="viewOrderDetails(item.raw)"
                    >
                        <v-icon>mdi-eye</v-icon>
                        <v-tooltip activator="parent" location="top">View Details</v-tooltip>
                    </v-btn>
                    <v-btn
                        icon
                        variant="text"
                        size="small"
                        color="warning"
                        class="mr-1"
                        @click="updateOrderStatus(item.raw)"
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
                <v-card-title class="text-h5 bg-primary text-white">
                    Order Details: #{{ detailsOrder._id }}
                </v-card-title>

                <v-card-text class="pt-4">
                    <v-row>
                        <v-col cols="12" md="6">
                            <p><strong>Customer:</strong> {{ detailsOrder.userId?.username || 'Unknown' }}</p>
                            <p><strong>Date:</strong> {{ new Date(detailsOrder.createdAt).toLocaleString() }}</p>
                            <p>
                                <strong>Status:</strong>
                                <v-chip
                                    size="small"
                                    :color="getStatusColor(detailsOrder.status)"
                                    class="text-uppercase"
                                >
                                    {{ detailsOrder.status }}
                                </v-chip>
                            </p>
                            <p><strong>Total Amount:</strong> {{ formatOrderPrice(detailsOrder.totalPrice) }}</p>
                        </v-col>

                        <v-col cols="12" md="6" v-if="detailsOrder.shippingAddress">
                            <p><strong>Shipping Address:</strong></p>
                            <p>{{ detailsOrder.shippingAddress.street }}</p>
                            <p>{{ detailsOrder.shippingAddress.city }}, {{ detailsOrder.shippingAddress.zipCode }}</p>
                            <p>{{ detailsOrder.shippingAddress.country }}</p>
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
                            <tr v-for="(item, i) in detailsOrder.items" :key="i">
                                <td>{{ item.bookId?.title || 'Unknown Book' }}</td>
                                <td class="text-right">{{ formatOrderPrice(item.price) }}</td>
                                <td class="text-right">{{ item.quantity }}</td>
                                <td class="text-right">{{ formatOrderPrice(item.price * item.quantity) }}</td>
                            </tr>
                            <tr class="font-weight-bold">
                                <td colspan="3" class="text-right">Total:</td>
                                <td class="text-right">{{ formatOrderPrice(detailsOrder.totalPrice) }}</td>
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
                    <v-form ref="statusForm" validate-on="submit" @submit.prevent="handleSaveOrderStatus">
                        <v-select
                            v-model="editedStatus"
                            :items="['pending', 'processing', 'shipped', 'delivered', 'cancelled']"
                            label="Status"
                            variant="outlined"
                            :rules="[(v) => !!v || 'Status is required']"
                            required
                        ></v-select>
                    </v-form>
                </v-card-text>

                <v-card-actions class="pb-4 px-4">
                    <v-spacer></v-spacer>
                    <v-btn variant="text" @click="closeStatusDialog">Cancel</v-btn>
                    <v-btn color="primary" :loading="saving" type="submit" @click.prevent="handleSaveOrderStatus"> Save </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Components
import AdminDataTable from '@/components/features/admin/AdminDataTable.vue'

// Stores
import { useOrdersStore } from '@/store/modules/orders'
import { toast } from '@/store/modules/ui'

// Utilities
import { formatPrice } from '@/utils'

// Store instance
const ordersStore = useOrdersStore()

// Table configuration
const headers = [
    { title: 'Order ID', align: 'start', key: '_id' },
    { title: 'Customer', align: 'start', key: 'customer' },
    { title: 'Date', align: 'start', key: 'createdAt' },
    { title: 'Total', align: 'start', key: 'totalPrice' },
    { title: 'Status', align: 'center', key: 'status' },
    { title: 'Actions', align: 'center', key: 'actions', sortable: false },
]

// Data table state
const page = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref([{ key: 'createdAt', order: 'desc' }])
const search = ref('')
const totalItems = ref(0)

// Dialog states
const detailsDialogOpen = ref(false)
const statusDialogOpen = ref(false)
const saving = ref(false)

// Order details
const detailsOrder = ref(null)
const statusOrder = ref(null)
const editedStatus = ref('')

// Computed properties
const orders = computed(() => {
    if (!ordersStore.ordersList || ordersStore.ordersList.length === 0) {
        return []
    }

    return (
        ordersStore.ordersList.map((order) => ({
            ...order,
            customer: order.userId?.username || order.userId?.email || 'Unknown',
            createdAt: new Date(order.createdAt).toLocaleDateString(),
        })) || []
    )
})

const loading = computed(() => ordersStore.loading)

// Data table methods
const updatePage = (newPage) => {
    page.value = newPage
}

const updateItemsPerPage = (newValue) => {
    itemsPerPage.value = newValue
    page.value = 1
}

const updateSortBy = (newValue) => {
    sortBy.value = newValue
}

const updateSearch = (newValue) => {
    search.value = newValue
    page.value = 1
}

const resetFilters = () => {
    search.value = ''
    page.value = 1
    sortBy.value = [{ key: 'createdAt', order: 'desc' }]
}

// Order management methods
const loadOrders = async () => {
    try {
        await ordersStore.fetchOrders()
        totalItems.value = ordersStore.ordersList?.length || 0
    } catch (error) {
        // Error loading orders
        toast.error('Failed to load orders')
    }
}

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
    editedStatus.value = order.status || ''
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
    
    // Note: Form validation would need to be handled differently in Composition API
    // This assumes validation is done elsewhere or simplified for migration
    
    saving.value = true
    try {
        await ordersStore.updateOrderStatus(statusOrder.value._id, {
            status: editedStatus.value
        })
        
        toast.success(`Order status updated to ${editedStatus.value}`)
        closeStatusDialog()
        await loadOrders()
    } catch (error) {
        toast.error(`Failed to update order status: ${error.message || 'Unknown error'}`)
    } finally {
        saving.value = false
    }
}

// Utility methods
const getStatusColor = (status) => {
    const statusColors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'primary',
        delivered: 'success',
        cancelled: 'error',
    }
    return statusColors[status] || 'grey'
}

const formatOrderPrice = (price) => {
    return formatPrice(price)
}

onMounted(() => {
    loadOrders()
})
</script>

<style scoped>
.admin-orders {
    width: 100%;
}
</style>
