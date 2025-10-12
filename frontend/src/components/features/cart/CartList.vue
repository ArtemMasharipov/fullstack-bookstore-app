<template>
    <v-container class="px-0">
        <div v-if="cartLoading" class="text-center py-10">
            <LoadingSpinner />
        </div>
        <template v-else>
            <v-alert
                v-if="!cartItems.length"
                text="Your cart is empty"
                type="info"
                class="text-center py-8"
                variant="tonal"
                icon="mdi-cart-off"
            ></v-alert>
            <template v-else>
                <div>
                    <CartItem
                        v-for="item in cartItems"
                        :key="item.bookId._id"
                        :item="item"
                        @remove="handleRemoveFromCart"
                        @update-quantity="updateQuantity"
                    />
                    <div class="d-flex justify-end mt-6">
                        <v-btn
                            v-if="isAuthenticated"
                            color="primary"
                            to="/checkout"
                            size="large"
                            prepend-icon="mdi-cart-check"
                        >
                            Proceed to Checkout
                        </v-btn>
                        <v-btn v-else color="primary" to="/login" size="large" prepend-icon="mdi-login">
                            Login to Checkout
                        </v-btn>
                    </div>
                </div>
            </template>
        </template>
        <v-card v-if="cartError" class="mt-4">
            <v-card-text>
                <ErrorMessage :message="cartError" @close="cartStore.clearError" />
            </v-card-text>
        </v-card>
        <v-card v-if="cartItems.length" class="mt-6" variant="outlined">
            <v-card-text>
                <div class="d-flex flex-column">
                    <div class="d-flex justify-space-between">
                        <span>Total Items:</span>
                        <span class="font-weight-medium">{{ itemCount }}</span>
                    </div>
                    <div class="d-flex justify-space-between mt-2">
                        <span>Total Price:</span>
                        <span class="font-weight-bold text-primary">${{ cartTotal }}</span>
                    </div>
                </div>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup>
import { useAuthStore, useCartStore } from '@/store'
import { logger } from '@/utils/logger'
import { storeToRefs } from 'pinia'
import { onMounted, watch } from 'vue'
import ErrorMessage from '../../ui/ErrorMessage.vue'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import CartItem from './CartItem.vue'

// Store setup
const cartStore = useCartStore()
const authStore = useAuthStore()

// Reactive state extraction
const { cartItems, loading: cartLoading, error: cartError, cartTotal, itemCount } = storeToRefs(cartStore)
const { isAuthenticated } = storeToRefs(authStore)

// Methods
const fetchCart = async () => {
    return cartStore.fetchCart()
}

const handleRemoveFromCart = async (itemId) => {
    await cartStore.removeFromCart(itemId)
    await fetchCart()
}

const updateQuantity = async (payload) => {
    await cartStore.updateQuantity(payload)
    await fetchCart()
}

// Watchers
watch(
    isAuthenticated,
    async (newVal) => {
        if (newVal) {
            try {
                await fetchCart()
            } catch (error) {
                logger.error('Failed to load cart', error, 'cart-list')
            }
        }
    },
    { immediate: true }
)

// Lifecycle
onMounted(() => {
    if (isAuthenticated.value) {
        fetchCart().catch((error) => {
            console.error('Failed to load cart:', error.message)
        })
    }
})
</script>
