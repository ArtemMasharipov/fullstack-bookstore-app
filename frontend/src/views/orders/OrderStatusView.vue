<template>
    <v-container>
        <v-card class="mx-auto" max-width="600px">
            <v-card-title class="text-h4 mb-2">Update Order Status</v-card-title>

            <v-card-text v-if="loading" class="text-center py-5">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </v-card-text>

            <v-card-text v-else-if="error">
                <v-alert type="error" variant="tonal">{{ error }}</v-alert>
            </v-card-text>

            <v-card-text v-else>
                <v-row>
                    <v-col cols="12" sm="6">
                        <p class="text-subtitle-1 font-weight-bold">
                            Order ID: <span class="font-weight-regular">{{ order._id }}</span>
                        </p>
                    </v-col>
                    <v-col cols="12" sm="6">
                        <p class="text-subtitle-1 font-weight-bold">
                            Current Status:
                            <v-chip
                                :color="getStatusColor(order.status)"
                                size="small"
                                class="text-uppercase font-weight-medium ml-2"
                            >
                                {{ order.status }}
                            </v-chip>
                        </p>
                    </v-col>
                </v-row>

                <v-divider class="my-4"></v-divider>

                <v-row class="mt-4">
                    <v-col cols="12" md="8">
                        <v-select
                            v-model="newStatus"
                            :items="statusOptions"
                            label="New Status"
                            variant="outlined"
                            density="comfortable"
                        ></v-select>
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex align-center">
                        <v-btn color="primary" block :disabled="newStatus === order.status" @click="updateStatus">
                            Update Status
                        </v-btn>
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions class="px-4 pb-4">
                <v-btn variant="text" :to="`/orders/${route.params.id}`" prepend-icon="mdi-arrow-left">
                    Back to Order Details
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/store'

const route = useRoute()
const router = useRouter()
const ordersStore = useOrdersStore()

const newStatus = ref('')
const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const currentOrder = computed(() => ordersStore.getOrder)
const loading = computed(() => ordersStore.loading)
const error = computed(() => ordersStore.error)
const order = computed(() => currentOrder.value || {})

const fetchOrderById = (id) => {
    return ordersStore.fetchOrderById(id)
}

const updateStatus = async () => {
    try {
        await ordersStore.updateOrderStatus({
            id: route.params.id,
            status: newStatus.value,
        })
        router.push(`/orders/${route.params.id}`)
    } catch (error) {
        // Notification is already handled by the store
    }
}

const getStatusColor = (status) => {
    const statusColors = {
        pending: 'warning',
        processing: 'info',
        shipped: 'success',
        delivered: 'primary',
        cancelled: 'error',
    }
    return statusColors[status] || 'grey'
}

// Watch for order changes to set initial status
watch(
    order,
    (newOrder) => {
        if (newOrder && newOrder.status) {
            newStatus.value = newOrder.status
        }
    },
    { immediate: true }
)

onMounted(async () => {
    await fetchOrderById(route.params.id)
})
</script>
