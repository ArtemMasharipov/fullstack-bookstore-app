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

<script>
import { useAuthStore, useCartStore } from '@/store'
import { syncError } from '@/utils'
import ErrorMessage from '../../ui/ErrorMessage.vue'
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import CartItem from './CartItem.vue'

export default {
    name: 'CartList',
    components: {
        CartItem,
        LoadingSpinner,
        ErrorMessage,
    },
    computed: {
        cartStore() {
            return useCartStore()
        },
        authStore() {
            return useAuthStore()
        },
        cartItems() {
            return this.cartStore.cartItems
        },
        cartLoading() {
            return this.cartStore.loading
        },
        cartError() {
            return this.cartStore.error
        },
        cartTotal() {
            return this.cartStore.cartTotal
        },
        itemCount() {
            return this.cartStore.itemCount
        },
        isAuthenticated() {
            return this.authStore.isAuthenticated
        },
    },
    watch: {
        isAuthenticated: {
            immediate: true,
            async handler(newVal) {
                if (newVal) {
                    try {
                        await this.fetchCart()
                    } catch (error) {
                        syncError('Failed to load cart: ' + error.message)
                    }
                }
            },
        },
    },
    created() {
        if (this.isAuthenticated) {
            this.fetchCart().catch((error) => {
                syncError('Failed to load cart: ' + error.message)
            })
        }
    },
    methods: {
        async fetchCart() {
            return this.cartStore.fetchCart()
        },
        async handleRemoveFromCart(itemId) {
            await this.cartStore.removeFromCart(itemId)
            await this.fetchCart()
        },
        async updateQuantity(payload) {
            await this.cartStore.updateQuantity(payload)
            await this.fetchCart()
        },
    },
}
</script>
