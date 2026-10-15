<template>
    <v-container class="py-6">
        <div class="d-flex align-center mb-6">
            <v-btn variant="text" to="/cart" prepend-icon="mdi-arrow-left" class="mr-2"> Back to Cart </v-btn>
            <h1 class="text-h4 font-weight-bold">Checkout</h1>
        </div>

        <div v-if="loading" class="text-center py-10">
            <loading-spinner />
        </div>

        <div v-else-if="error">
            <error-message :message="error" />
        </div>

        <v-row v-else>
            <!-- Shipping form -->
            <v-col cols="12" md="7">
                <v-card>
                    <v-card-title class="text-h6">Shipping Information</v-card-title>
                    <v-card-text>
                        <v-form ref="formRef" @submit.prevent="submitOrder">
                            <v-textarea
                                v-model="orderData.address"
                                label="Shipping Address"
                                rows="3"
                                :rules="addressRules"
                                prepend-inner-icon="mdi-map-marker-outline"
                            />

                            <v-text-field
                                v-model="orderData.phone"
                                label="Phone Number"
                                type="tel"
                                :rules="phoneRules"
                                prepend-inner-icon="mdi-phone-outline"
                            />

                            <v-btn
                                type="submit"
                                color="primary"
                                block
                                :loading="submitting"
                                :disabled="!cartItems.length"
                                size="large"
                                class="mt-2"
                                prepend-icon="mdi-check-circle-outline"
                            >
                                Place Order
                            </v-btn>
                        </v-form>
                    </v-card-text>
                </v-card>
            </v-col>

            <!-- Order summary sidebar -->
            <v-col cols="12" md="5">
                <div class="checkout-summary-sticky">
                    <v-card variant="outlined">
                        <v-card-title class="text-subtitle-1 font-weight-bold">
                            Order Summary ({{ cartItems.length }} items)
                        </v-card-title>
                        <v-card-text>
                            <v-list density="compact" class="pa-0 bg-transparent">
                                <v-list-item v-for="item in cartItems" :key="item.bookId" class="px-0">
                                    <v-list-item-title class="text-body-2">
                                        {{ item.title }}
                                    </v-list-item-title>
                                    <v-list-item-subtitle class="text-caption">
                                        {{ item.quantity }} x {{ formatMoney(item.unitPrice) }}
                                    </v-list-item-subtitle>
                                    <template v-slot:append>
                                        <span class="text-body-2 font-weight-medium">
                                            {{ formatMoney(item.lineTotal) }}
                                        </span>
                                    </template>
                                </v-list-item>
                            </v-list>

                            <v-divider class="my-3" />

                            <div class="d-flex justify-space-between mb-2">
                                <span class="text-medium-emphasis">Subtotal</span>
                                <span>{{ formatMoney(quote?.itemsTotal) }}</span>
                            </div>
                            <div class="d-flex justify-space-between mb-3">
                                <span class="text-medium-emphasis">Shipping</span>
                                <span>{{ formatMoney(quote?.shipping) }}</span>
                            </div>

                            <v-divider class="mb-3" />

                            <div class="d-flex justify-space-between">
                                <span class="text-subtitle-1 font-weight-bold">Total</span>
                                <span class="text-subtitle-1 font-weight-bold text-primary">
                                    {{ formatMoney(quote?.total) }}
                                </span>
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ErrorMessage from '@/components/ui/ErrorMessage.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import { useCartStore, useOrdersStore } from '@/stores'
import { formatMoney } from '@/utils'

const router = useRouter()
const cartStore = useCartStore()
const ordersStore = useOrdersStore()

const formRef = ref(null)
const submitting = ref(false)

const orderData = reactive({
    address: '',
    phone: '',
})

const addressRules = [(v) => !!v || 'Address is required', (v) => v.length >= 10 || 'Please enter a full address']
const phoneRules = [
    (v) => !!v || 'Phone number is required',
    (v) => /^\+?[\d\s()-]{7,}$/.test(v) || 'Enter a valid phone number',
]

const cartItems = computed(() => cartStore.lines)
const quote = computed(() => cartStore.quote)
const loading = computed(() => cartStore.status === 'loading')
const error = computed(() => cartStore.error)

const submitOrder = async () => {
    const { valid } = await formRef.value.validate()
    if (!valid) return

    submitting.value = true
    try {
        const order = await ordersStore.createOrder({
            ...orderData,
            items: cartItems.value,
            total: quote.value?.total,
        })
        router.push(`/orders/${order._id}`)
    } catch (error) {
        // Notification is already handled by the store
    } finally {
        submitting.value = false
    }
}
</script>

<style scoped>
.checkout-summary-sticky {
    position: sticky;
    top: 80px;
}
</style>
