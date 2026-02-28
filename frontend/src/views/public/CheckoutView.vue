<template>
    <v-container class="checkout">
        <v-card class="mx-auto" max-width="800px">
            <v-card-title class="text-h4 mb-2">Checkout</v-card-title>

            <v-card-text v-if="loading" class="text-center py-5">
                <loading-spinner />
            </v-card-text>

            <v-card-text v-else-if="error">
                <error-message :message="error" />
            </v-card-text>

            <template v-else>
                <v-card-text>
                    <v-sheet class="pa-4 mb-4 rounded border">
                        <div class="text-h6 mb-3">Order Summary</div>

                        <v-list density="compact" class="pa-0 bg-transparent">
                            <v-list-item v-for="item in cartItems" :key="item.id" :title="item.bookId?.title || 'Unknown Book'">
                                <template v-slot:append> {{ item.quantity }} x {{ formatPrice(item.price) }} </template>
                            </v-list-item>
                        </v-list>

                        <v-divider class="my-2"></v-divider>

                        <div class="d-flex justify-end font-weight-bold text-body-1">
                            Total: {{ formatPrice(cartTotal) }}
                        </div>
                    </v-sheet>

                    <v-form @submit.prevent="submitOrder">
                        <v-textarea
                            id="address"
                            v-model="orderData.address"
                            label="Shipping Address"
                            variant="outlined"
                            rows="3"
                            required
                        ></v-textarea>

                        <v-text-field
                            id="phone"
                            v-model="orderData.phone"
                            label="Phone Number"
                            variant="outlined"
                            type="tel"
                            required
                        ></v-text-field>

                        <v-btn type="submit" color="primary" block :disabled="loading" size="large" class="mt-4">
                            Place Order
                        </v-btn>
                    </v-form>
                </v-card-text>
            </template>
        </v-card>
    </v-container>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCartStore, useOrdersStore } from '@/stores'
import { formatPrice } from '@/utils'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()

const orderData = reactive({
    address: '',
    phone: '',
})

const cartItems = computed(() => cartStore.cartItems)
const cartTotal = computed(() => cartStore.cartTotal)
const loading = computed(() => cartStore.loading)
const error = computed(() => cartStore.error)

const submitOrder = async () => {
    try {
        const order = await ordersStore.createOrder({
            ...orderData,
            items: cartItems.value,
            total: cartTotal.value,
        })
        router.push(`/orders/${order._id}`)
    } catch (error) {
        // Notification is already handled by the store
    }
}
</script>
