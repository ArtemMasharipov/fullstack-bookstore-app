<template>
    <div>
        <!-- Loading state -->
        <v-container v-if="loading" class="py-8">
            <v-card class="pa-4">
                <v-card-title class="pb-4">Loading orders...</v-card-title>
                <v-progress-linear indeterminate color="primary"></v-progress-linear>
                <v-card-text>
                    <div class="d-flex justify-center align-center pa-4">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </div>
                </v-card-text>
            </v-card>
        </v-container>

        <!-- Error state -->
        <v-container v-else-if="error" class="py-5">
            <error-message :message="error" type="error" icon="mdi-alert-circle" @close="clearError" />

            <div class="d-flex justify-center mt-4">
                <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchOrders"> Retry </v-btn>
            </div>
        </v-container>

        <!-- Empty state -->
        <v-container v-else-if="orders.length === 0" class="py-8">
            <v-alert type="info" variant="tonal" class="text-center" icon="mdi-package-variant" border="start">
                <p class="mb-2">No orders found</p>
                <v-btn color="primary" variant="text" to="/books" prepend-icon="mdi-shopping"> Start shopping </v-btn>
            </v-alert>
        </v-container>

        <!-- Orders list -->
        <v-container v-else fluid class="pa-4">
            <v-card flat class="mb-4">
                <v-card-title class="text-h5 pb-2">
                    Your Orders
                    <v-chip class="ml-2" size="small" color="primary">{{ orders.length }}</v-chip>
                </v-card-title>

                <v-card-text>
                    <v-row dense>
                        <v-col cols="12" sm="6" md="4">
                            <v-select
                                v-model="statusFilter"
                                label="Filter by status"
                                :items="statusOptions"
                                variant="outlined"
                                density="comfortable"
                                clearable
                                hide-details
                                prepend-inner-icon="mdi-filter-variant"
                                @update:model-value="applyFilter"
                            ></v-select>
                        </v-col>

                        <v-col cols="12" sm="6" md="4">
                            <v-select
                                v-model="sortBy"
                                label="Sort by"
                                :items="sortOptions"
                                variant="outlined"
                                density="comfortable"
                                hide-details
                                prepend-inner-icon="mdi-sort"
                                @update:model-value="applySort"
                            ></v-select>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <transition-group name="order-list" tag="div">
                <v-card
                    v-for="order in displayedOrders"
                    :key="order._id"
                    class="mb-4"
                    variant="outlined"
                    :elevation="1"
                    hover
                >
                    <v-card-item>
                        <template v-slot:prepend>
                            <v-avatar color="primary" rounded class="mr-3">
                                <v-icon icon="mdi-package-variant" color="white"></v-icon>
                            </v-avatar>
                        </template>

                        <v-card-title class="text-h6">
                            Order #{{ order._id.substring(order._id.length - 8) }}
                        </v-card-title>

                        <v-card-subtitle>
                            {{ formatDate(order.createdAt) }}
                        </v-card-subtitle>
                    </v-card-item>

                    <v-card-text>
                        <v-row align="center">
                            <v-col cols="12" sm="6" md="4">
                                <div class="d-flex align-center">
                                    <v-icon icon="mdi-currency-uah" size="small" class="mr-1"></v-icon>
                                    <span class="text-body-1 font-weight-medium">
                                        Total: {{ formatPrice(order.total) }}
                                    </span>
                                </div>
                            </v-col>

                            <v-col cols="12" sm="6" md="4">
                                <div class="d-flex align-center">
                                    <v-icon icon="mdi-book-multiple" size="small" class="mr-1"></v-icon>
                                    <span class="text-body-2"> Items: {{ order.items?.length || 0 }} </span>
                                </div>
                            </v-col>

                            <v-col cols="12" sm="12" md="4" class="d-flex justify-start justify-md-end mt-2 mt-md-0">
                                <v-chip
                                    :color="getStatusColor(order.status)"
                                    variant="tonal"
                                    class="text-uppercase font-weight-medium"
                                    :prepend-icon="getStatusIcon(order.status)"
                                >
                                    {{ order.status }}
                                </v-chip>
                            </v-col>
                        </v-row>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-actions>
                        <v-spacer></v-spacer>

                        <v-btn
                            color="primary"
                            variant="text"
                            :to="`/orders/${order._id}`"
                            prepend-icon="mdi-eye"
                            density="comfortable"
                        >
                            View Details
                        </v-btn>
                        <v-btn
                            v-if="authStore && authStore.hasPermission('update:order')"
                            color="warning"
                            variant="text"
                            :to="`/orders/${order._id}/status`"
                            prepend-icon="mdi-pencil"
                            density="comfortable"
                        >
                            Update Status
                        </v-btn>
                    </v-card-actions>
                </v-card>
            </transition-group>

            <!-- Pagination if needed -->
            <v-pagination
                v-if="pageCount > 1"
                v-model="currentPage"
                :length="pageCount"
                rounded
                class="mt-6"
                color="primary"
            ></v-pagination>
        </v-container>
    </div>
</template>

<script setup>
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import { useAuthStore, useOrdersStore } from '@/stores'
import { formatPrice } from '@/utils'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'

/**
 * Component for displaying and managing user orders
 * All UI logic moved from ordersUi store to component level (PHASE 2)
 */

// Store setup
const authStore = useAuthStore()
const ordersStore = useOrdersStore()

// Reactive state extraction from store
const { ordersList, loading, error } = storeToRefs(ordersStore)

// Local component state (moved from ordersUi store)
const statusFilter = ref(null)
const sortBy = ref('newest')
const currentPage = ref(1)
const itemsPerPage = ref(5)

// Static options (no need to be reactive)
const statusOptions = [
    { title: 'All Orders', value: null },
    { title: 'Pending', value: 'pending' },
    { title: 'Processing', value: 'processing' },
    { title: 'Shipped', value: 'shipped' },
    { title: 'Delivered', value: 'delivered' },
    { title: 'Cancelled', value: 'cancelled' },
]

const sortOptions = [
    { title: 'Newest First', value: 'newest' },
    { title: 'Oldest First', value: 'oldest' },
    { title: 'Highest Total', value: 'total-desc' },
    { title: 'Lowest Total', value: 'total-asc' },
]

// Computed properties
const orders = computed(() => {
    return Array.isArray(ordersList.value) ? ordersList.value : []
})

/**
 * Filter and sort orders based on selected criteria
 */
const filteredOrders = computed(() => {
    let result = [...orders.value]

    // Apply status filter
    if (statusFilter.value) {
        result = result.filter((order) => order.status === statusFilter.value)
    }

    // Apply sort
    switch (sortBy.value) {
        case 'newest':
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            break
        case 'oldest':
            result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            break
        case 'total-desc':
            result.sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
            break
        case 'total-asc':
            result.sort((a, b) => parseFloat(a.total) - parseFloat(b.total))
            break
    }

    return result
})

/**
 * Get orders for current page
 */
const displayedOrders = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return filteredOrders.value.slice(start, end)
})

/**
 * Calculate total page count
 */
const pageCount = computed(() => {
    return Math.max(1, Math.ceil(filteredOrders.value.length / itemsPerPage.value))
})

// Methods
const fetchOrders = async () => {
    try {
        await ordersStore.fetchOrders()
    } catch (error) {
        if (error.status !== 401) {
            if (error.status === 404) {
                logger.warn('Orders API endpoint not found', null, 'orders-list')
            } else {
                logger.error('Failed to load orders', error, 'orders-list')
            }
        }
    }
}

const getStatusColor = (status) => {
    if (!status) return 'grey'
    const statusColors = {
        pending: 'orange',
        processing: 'blue',
        shipped: 'cyan',
        delivered: 'success',
        cancelled: 'error',
    }
    return statusColors[status] || 'grey'
}

const getStatusIcon = (status) => {
    if (!status) return 'mdi-help-circle'
    const statusIcons = {
        pending: 'mdi-clock-outline',
        processing: 'mdi-cog-outline',
        shipped: 'mdi-truck-delivery-outline',
        delivered: 'mdi-check-circle-outline',
        cancelled: 'mdi-close-circle-outline',
    }
    return statusIcons[status] || 'mdi-help-circle'
}

const formatDate = (date) => {
    if (!date) return 'Unknown date'
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch (err) {
        return String(date)
    }
}

const clearError = () => {
    ordersStore.clearError()
}

const applyFilter = (value) => {
    statusFilter.value = value
    currentPage.value = 1 // Reset to first page
}

const applySort = (value) => {
    sortBy.value = value
    currentPage.value = 1 // Reset to first page
}

// Lifecycle
onMounted(async () => {
    await fetchOrders()
})
</script>

<style scoped>
.order-list-move,
.order-list-enter-active,
.order-list-leave-active {
    transition: all 0.5s ease;
}

.order-list-enter-from,
.order-list-leave-to {
    opacity: 0;
    transform: translateY(30px);
}

.order-list-leave-active {
    position: absolute;
}
</style>
