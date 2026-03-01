<template>
    <v-container>
        <v-breadcrumbs :items="breadcrumbItems" class="pa-0 mb-4" />

        <v-card class="mx-auto" max-width="800">
            <v-card-text v-if="loading" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="48" />
                <p class="text-medium-emphasis mt-4">Loading order details...</p>
            </v-card-text>

            <v-card-text v-else-if="error">
                <v-alert type="error" variant="tonal">{{ error }}</v-alert>
            </v-card-text>

            <template v-else>
                <!-- Header -->
                <v-card-item>
                    <template v-slot:prepend>
                        <v-avatar color="primary" size="48">
                            <v-icon icon="mdi-package-variant" color="white" />
                        </v-avatar>
                    </template>
                    <v-card-title class="text-h5">
                        Order #{{ order._id?.substring(order._id.length - 8) }}
                    </v-card-title>
                    <v-card-subtitle> Placed on {{ formatDate(order.createdAt) }} </v-card-subtitle>
                    <template v-slot:append>
                        <v-chip
                            :color="getStatusColor(order.status)"
                            :prepend-icon="getStatusIcon(order.status)"
                            class="text-uppercase font-weight-medium"
                        >
                            {{ order.status }}
                        </v-chip>
                    </template>
                </v-card-item>

                <v-divider />

                <!-- Items -->
                <v-card-text>
                    <h3 class="text-subtitle-1 font-weight-bold mb-3">
                        <v-icon icon="mdi-book-multiple" size="small" class="mr-1" />
                        Items ({{ order.items?.length || 0 }})
                    </h3>
                    <v-list density="compact" variant="outlined" rounded class="mb-4">
                        <v-list-item v-for="item in order.items" :key="item.id">
                            <template v-slot:prepend>
                                <v-avatar size="40" rounded color="surface-variant">
                                    <v-icon icon="mdi-book-open-variant" size="small" />
                                </v-avatar>
                            </template>
                            <v-list-item-title>{{ item.title }}</v-list-item-title>
                            <v-list-item-subtitle>Qty: {{ item.quantity }}</v-list-item-subtitle>
                            <template v-slot:append>
                                <span class="font-weight-medium">{{ formatPrice(item.price) }}</span>
                            </template>
                        </v-list-item>
                    </v-list>

                    <!-- Order info -->
                    <v-row>
                        <v-col cols="12" sm="6">
                            <v-card variant="tonal" color="surface-variant" flat>
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis mb-1">Delivery Address</div>
                                    <div class="d-flex align-center">
                                        <v-icon icon="mdi-map-marker-outline" size="small" class="mr-2" />
                                        <span class="text-body-2">{{ order.address || 'N/A' }}</span>
                                    </div>
                                    <div class="d-flex align-center mt-2">
                                        <v-icon icon="mdi-phone-outline" size="small" class="mr-2" />
                                        <span class="text-body-2">{{ order.phone || 'N/A' }}</span>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-card variant="tonal" color="surface-variant" flat>
                                <v-card-text>
                                    <div class="text-caption text-medium-emphasis mb-1">Order Summary</div>
                                    <div class="d-flex justify-space-between mb-1">
                                        <span class="text-body-2 text-medium-emphasis">Date</span>
                                        <span class="text-body-2">{{ formatDate(order.createdAt) }}</span>
                                    </div>
                                    <v-divider class="my-2" />
                                    <div class="d-flex justify-space-between">
                                        <span class="text-subtitle-1 font-weight-bold">Total</span>
                                        <span class="text-subtitle-1 font-weight-bold text-secondary">{{
                                            formatPrice(order.total)
                                        }}</span>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider />

                <!-- Actions -->
                <v-card-actions class="pa-4">
                    <v-btn variant="text" to="/orders" prepend-icon="mdi-arrow-left"> Back to Orders </v-btn>
                    <v-spacer />
                    <v-btn
                        v-if="authStore.hasPermission('update:order')"
                        color="primary"
                        :to="`/orders/${order._id}/status`"
                        prepend-icon="mdi-pencil"
                    >
                        Update Status
                    </v-btn>
                </v-card-actions>
            </template>
        </v-card>
    </v-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore, useOrdersStore } from '@/stores'
import { formatPrice } from '@/utils'

const route = useRoute()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()

const currentOrder = computed(() => ordersStore.getOrder)
const loading = computed(() => ordersStore.loading)
const error = computed(() => ordersStore.error)
const order = computed(() => currentOrder.value || {})

const breadcrumbItems = computed(() => [
    { title: 'Orders', to: '/orders' },
    {
        title: order.value?._id ? `#${order.value._id.substring(order.value._id.length - 8)}` : 'Details',
        disabled: true,
    },
])

const formatDate = (date) => {
    if (!date) return 'Unknown'
    try {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    } catch {
        return String(date)
    }
}

const getStatusColor = (status) => {
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
    const statusIcons = {
        pending: 'mdi-clock-outline',
        processing: 'mdi-cog-outline',
        shipped: 'mdi-truck-delivery-outline',
        delivered: 'mdi-check-circle-outline',
        cancelled: 'mdi-close-circle-outline',
    }
    return statusIcons[status] || 'mdi-help-circle'
}

onMounted(async () => {
    await ordersStore.fetchOrderById(route.params.id)
})
</script>
