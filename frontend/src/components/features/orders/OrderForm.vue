<template>
    <v-form class="order-form" @submit.prevent="handleSubmit">
        <v-text-field v-model="form.street" label="Street" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.city" label="City" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.country" label="Country" variant="outlined" required></v-text-field>

        <v-text-field v-model="form.zipCode" label="Zip Code" variant="outlined" required></v-text-field>

        <v-btn type="submit" color="primary" block :loading="loading">
            {{ loading ? 'Processing...' : 'Place Order' }}
        </v-btn>
    </v-form>
</template>

<script setup>
import { useOrdersStore } from '@/stores'
import { ROUTE_NAMES } from '@/utils/constants/routes'
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

/**
 * Composables
 */
const router = useRouter()
const ordersStore = useOrdersStore()

/**
 * Reactive data
 */
const form = reactive({
    street: '',
    city: '',
    country: '',
    zipCode: '',
})

/**
 * Computed properties
 */
const loading = computed(() => ordersStore.loading)

/**
 * Methods
 */
const handleSubmit = async () => {
    try {
        await ordersStore.createOrder({
            shippingAddress: { ...form },
        })
        router.push({ name: ROUTE_NAMES.ORDERS })
    } catch (error) {
        // Notification is already handled by the store
    }
}
</script>
