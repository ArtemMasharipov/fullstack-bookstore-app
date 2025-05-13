<template>
    <v-container class="px-0">
        <div v-if="cartLoading" class="text-center py-10">
            <loading-spinner />
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
                    <cart-item
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
                        
                        <v-btn
                            v-else
                            color="primary"
                            to="/login"
                            size="large"
                            prepend-icon="mdi-login"
                        >
                            Login to Checkout
                        </v-btn>
                    </div>
                </div>
            </template>
        </template>

        <v-card v-if="cartError" class="mt-4">
            <v-card-text>
                <error-message :message="cartError" @close="cartStore.clearError" />
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
import { useAuthStore, useCartStore, toast } from '@/stores';
import { mapGetters } from 'pinia';
import ErrorMessage from '../common/ErrorMessage.vue';
import LoadingSpinner from '../common/LoadingSpinner.vue';
import CartItem from './CartItem.vue';

export default {
    name: 'CartList',

    components: {
        CartItem,
        LoadingSpinner,
        ErrorMessage,
    },

    computed: {
        ...mapGetters(useCartStore, {
            cartItems: 'cartItems',
            cartLoading: 'loading',
            cartError: 'error',
            cartTotal: 'cartTotal',
            itemCount: 'itemCount'
        }),
        ...mapGetters(useAuthStore, ['isAuthenticated']),
        
        // Store instances for methods that might need them
        cartStore() {
            return useCartStore();
        },
        authStore() {
            return useAuthStore();
        }
    },

    watch: {
        isAuthenticated: {            
            immediate: true,
            async handler(newVal) {
                if (newVal) {
                    try {
                        await this.fetchCart();
                    } catch (error) {
                        toast.error('Failed to load cart: ' + error.message);
                    }
                }
            },
        },
    },    
    created() {
        if (this.isAuthenticated) {
            this.fetchCart().catch((error) => {
                toast.error('Failed to load cart: ' + error.message);
            });
        }
    },

    methods: {
        async fetchCart() {
            return this.cartStore.fetchCart();
        },
        
        handleRemoveFromCart(itemId) {
            this.cartStore.removeFromCart(itemId);
        },
        
        updateQuantity(payload) {
            this.cartStore.updateQuantity(payload);
        }
    }
};
</script>
