<template>
    <div>
        <div v-if="cartLoading" class="text-center py-10">
            <LoadingSpinner />
        </div>

        <template v-else>
            <!-- Empty state -->
            <v-alert
                v-if="!cartItems.length"
                text="Your cart is empty. Start browsing to add some books!"
                type="info"
                class="text-center py-8"
                variant="tonal"
                icon="mdi-cart-off"
            >
                <template v-slot:append>
                    <v-btn variant="text" to="/books" prepend-icon="mdi-book-open-page-variant-outline">
                        Browse Books
                    </v-btn>
                </template>
            </v-alert>

            <!-- Cart content — two-column on desktop -->
            <v-row v-else>
                <!-- Items column -->
                <v-col cols="12" md="8">
                    <CartItem v-for="item in cartItems" :key="item.bookId?.id ?? item.id ?? item._id" :item="item" />
                </v-col>

                <!-- Sticky summary column -->
                <v-col cols="12" md="4">
                    <div class="cart-summary-sticky">
                        <v-card variant="outlined">
                            <v-card-title class="text-subtitle-1 font-weight-bold">Order Summary</v-card-title>
                            <v-card-text>
                                <div class="d-flex justify-space-between mb-2">
                                    <span class="text-medium-emphasis">Items</span>
                                    <span class="font-weight-medium">{{ totalQuantity }}</span>
                                </div>
                                <div class="d-flex justify-space-between mb-2">
                                    <span class="text-medium-emphasis">Subtotal</span>
                                    <span class="font-weight-medium">{{ formatPrice(cartTotal) }}</span>
                                </div>
                                <div class="d-flex justify-space-between mb-4">
                                    <span class="text-medium-emphasis">Shipping</span>
                                    <span class="font-weight-medium text-success">Free</span>
                                </div>
                                <v-divider class="mb-4" />
                                <div class="d-flex justify-space-between mb-4">
                                    <span class="text-subtitle-1 font-weight-bold">Total</span>
                                    <span class="text-subtitle-1 font-weight-bold text-primary">
                                        {{ formatPrice(cartTotal) }}
                                    </span>
                                </div>

                                <v-btn
                                    v-if="isAuthenticated"
                                    color="primary"
                                    to="/checkout"
                                    block
                                    size="large"
                                    prepend-icon="mdi-cart-check"
                                >
                                    Proceed to Checkout
                                </v-btn>
                                <v-btn v-else color="primary" to="/login" block size="large" prepend-icon="mdi-login">
                                    Login to Checkout
                                </v-btn>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-col>
            </v-row>
        </template>

        <!-- Error display -->
        <v-card v-if="cartError" class="mt-4">
            <v-card-text>
                <ErrorMessage :message="cartError" @close="cartStore.clearError" />
            </v-card-text>
        </v-card>
    </div>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/stores'
import { formatPrice } from '@/utils'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import ErrorMessage from '../../ui/ErrorMessage.vue'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import CartItem from './CartItem.vue'

const cartStore = useCartStore()
const authStore = useAuthStore()

const { cartItems, loading: cartLoading, error: cartError, cartTotal, totalQuantity } = storeToRefs(cartStore)
const { isAuthenticated } = storeToRefs(authStore)

watch(
    isAuthenticated,
    async (newVal) => {
        if (newVal) {
            try {
                await cartStore.fetchCart()
            } catch (error) {
                logger.error('Failed to load cart', error, 'cart-list')
            }
        }
    },
    { immediate: true }
)
</script>

<style scoped>
.cart-summary-sticky {
    position: sticky;
    top: 80px;
}
</style>
